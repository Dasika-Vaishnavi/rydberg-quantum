import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Player {
  id: string;
  session_id: string;
  display_name: string;
  lat: number;
  lon: number;
  atom_state: string;
  last_seen: string;
}

const SESSION_ID_KEY = "rydberg-session-id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = `player-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export function usePlayerSync(lat: number, lon: number, atomState: string, label: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const sessionId = useMemo(() => getSessionId(), []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registeredRef = useRef(false);

  // Register or update own position
  const updatePosition = useCallback(async (newLat: number, newLon: number, state: string) => {
    try {
      const { error } = await supabase
        .from("players")
        .upsert(
          {
            session_id: sessionId,
            display_name: label || "atom",
            lat: newLat,
            lon: newLon,
            atom_state: state,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "session_id" }
        );
      if (error) console.error("Player sync error:", error);
    } catch (e) {
      console.error("Player sync exception:", e);
    }
  }, [sessionId, label]);

  // Initial registration + periodic heartbeat
  useEffect(() => {
    if (lat === 0 && lon === 0) return; // waiting for geo

    if (!registeredRef.current) {
      updatePosition(lat, lon, atomState);
      registeredRef.current = true;
    }

    intervalRef.current = setInterval(() => {
      updatePosition(lat, lon, atomState);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lat, lon, atomState, updatePosition]);

  // Fetch all players initially
  useEffect(() => {
    const fetchPlayers = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("players")
        .select("*")
        .gte("last_seen", fiveMinAgo);
      if (data) setPlayers(data as Player[]);
    };
    fetchPlayers();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("players-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setPlayers((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
          } else {
            const updated = payload.new as Player;
            setPlayers((prev) => {
              const idx = prev.findIndex((p) => p.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [...prev, updated];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      supabase.from("players").delete().eq("session_id", sessionId);
    };
  }, [sessionId]);

  return { players, sessionId, updatePosition };
}
