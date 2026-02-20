import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePlayerSync } from "@/hooks/usePlayerSync";

const RYDBERG_DURATION = 5000;
const ENTANGLE_DISTANCE_KM = 0.1; // 100m

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const stateColors: Record<string, string> = {
  ground: "#00ff88",
  rydberg: "#00d4ff",
  entangled: "#ff3366",
};

function playExciteSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playEntangleSound() {
  try {
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = 300;
    osc2.frequency.value = 450;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.2);
  } catch {}
}

interface MapEvent {
  id: string;
  text: string;
  type: "rydberg" | "entangle" | "decay";
  time: number;
}

const MapView = () => {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [atomState, setAtomState] = useState<string>("ground");
  const [decayTimer, setDecayTimer] = useState(0);
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const atomStateRef = useRef("ground");
  const decayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { players, sessionId, updatePosition } = usePlayerSync(geo.lat, geo.lon, atomState, geo.label);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userGlowRef = useRef<L.CircleMarker | null>(null);
  const peerMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const peerGlowsRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const entangleLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const centeredRef = useRef(false);

  const addEvent = useCallback((text: string, type: MapEvent["type"]) => {
    const ev: MapEvent = { id: Math.random().toString(36).slice(2), text, type, time: Date.now() };
    setEvents((prev) => [...prev.slice(-4), ev]);
  }, []);

  const nearbyPlayers = useMemo(() => {
    if (geo.loading) return [];
    return players.filter((p) => {
      if (p.session_id === sessionId) return false;
      return haversineKm(geo.lat, geo.lon, p.lat, p.lon) < 5;
    });
  }, [players, geo, sessionId]);

  // Excite handler
  const doExcite = useCallback(() => {
    if (atomStateRef.current !== "ground") return;

    atomStateRef.current = "rydberg";
    setAtomState("rydberg");
    playExciteSound();
    setFlashColor("rgba(0,212,255,0.25)");
    setTimeout(() => setFlashColor(null), 300);
    addEvent("⚡ you entered rydberg state", "rydberg");

    // Update DB immediately
    if (!geo.loading) {
      updatePosition(geo.lat, geo.lon, "rydberg");
    }

    // Start decay countdown
    let remaining = RYDBERG_DURATION;
    setDecayTimer(remaining);

    if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    decayTimerRef.current = setInterval(() => {
      remaining -= 100;
      setDecayTimer(remaining);
      if (remaining <= 0) {
        if (decayTimerRef.current) clearInterval(decayTimerRef.current);
        atomStateRef.current = "ground";
        setAtomState("ground");
        setDecayTimer(0);
        addEvent("○ you returned to ground state", "decay");
        if (!geo.loading) {
          updatePosition(geo.lat, geo.lon, "ground");
        }
      }
    }, 100);
  }, [geo, updatePosition, addEvent]);

  // Check for entanglement with nearby rydberg players
  useEffect(() => {
    if (atomStateRef.current !== "rydberg") return;

    const entangleCandidate = nearbyPlayers.find(
      (p) => p.atom_state === "rydberg" && haversineKm(geo.lat, geo.lon, p.lat, p.lon) < ENTANGLE_DISTANCE_KM
    );

    if (entangleCandidate) {
      atomStateRef.current = "entangled";
      setAtomState("entangled");
      playEntangleSound();
      setFlashColor("rgba(255,51,102,0.2)");
      setTimeout(() => setFlashColor(null), 400);
      addEvent(`🔴 entangled with ${entangleCandidate.display_name}!`, "entangle");
      updatePosition(geo.lat, geo.lon, "entangled");
    }
  }, [nearbyPlayers, geo, updatePosition, addEvent]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") doExcite();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [doExcite]);

  // Cleanup decay timer
  useEffect(() => {
    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, []);

  // Fade out old events
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => prev.filter((e) => Date.now() - e.time < 5000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [37.7, -122.4],
      zoom: 15,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Center on user geo
  useEffect(() => {
    if (!mapRef.current || geo.loading || centeredRef.current) return;
    if (geo.lat !== 0 || geo.lon !== 0) {
      mapRef.current.setView([geo.lat, geo.lon], 15);
      centeredRef.current = true;
    }
  }, [geo]);

  // User marker with glow
  useEffect(() => {
    if (!mapRef.current || geo.loading) return;
    const color = stateColors[atomState] || "#e8f4f8";
    const isExcited = atomState !== "ground";

    if (!userMarkerRef.current) {
      // Glow circle
      userGlowRef.current = L.circleMarker([geo.lat, geo.lon], {
        radius: isExcited ? 24 : 16,
        fillColor: isExcited ? color : "#ffd700",
        fillOpacity: isExcited ? 0.25 : 0.1,
        color: "transparent",
        weight: 0,
      }).addTo(mapRef.current);

      userMarkerRef.current = L.circleMarker([geo.lat, geo.lon], {
        radius: 12,
        fillColor: isExcited ? color : "#ffd700",
        fillOpacity: 0.9,
        color: isExcited ? color : "#ffd700",
        weight: 2,
      }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng([geo.lat, geo.lon]);
      userMarkerRef.current.setStyle({
        fillColor: isExcited ? color : "#ffd700",
        color: isExcited ? color : "#ffd700",
      });
      userGlowRef.current?.setLatLng([geo.lat, geo.lon]);
      userGlowRef.current?.setStyle({
        radius: isExcited ? 24 : 16,
        fillColor: isExcited ? color : "#ffd700",
        fillOpacity: isExcited ? 0.25 : 0.1,
      });
    }
  }, [geo, atomState]);

  // Peer markers with glow
  useEffect(() => {
    if (!mapRef.current) return;
    const currentIds = new Set(nearbyPlayers.map((p) => p.id));

    peerMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        peerMarkersRef.current.delete(id);
        peerGlowsRef.current.get(id)?.remove();
        peerGlowsRef.current.delete(id);
      }
    });

    // Clear old entangle lines
    entangleLinesRef.current.forEach((line) => line.remove());
    entangleLinesRef.current.clear();

    nearbyPlayers.forEach((p) => {
      const color = stateColors[p.atom_state] || "#e8f4f8";
      const isExcited = p.atom_state !== "ground";
      const existing = peerMarkersRef.current.get(p.id);

      if (existing) {
        existing.setLatLng([p.lat, p.lon]);
        existing.setStyle({ fillColor: color, color, radius: isExcited ? 10 : 8 });
        const glow = peerGlowsRef.current.get(p.id);
        glow?.setLatLng([p.lat, p.lon]);
        glow?.setStyle({
          radius: isExcited ? 20 : 12,
          fillColor: color,
          fillOpacity: isExcited ? 0.2 : 0.05,
        });
      } else {
        const glow = L.circleMarker([p.lat, p.lon], {
          radius: isExcited ? 20 : 12,
          fillColor: color,
          fillOpacity: isExcited ? 0.2 : 0.05,
          color: "transparent",
          weight: 0,
        }).addTo(mapRef.current!);
        peerGlowsRef.current.set(p.id, glow);

        const marker = L.circleMarker([p.lat, p.lon], {
          radius: isExcited ? 10 : 8,
          fillColor: color,
          fillOpacity: 0.8,
          color,
          weight: 1.5,
        })
          .addTo(mapRef.current!)
          .bindPopup(`<b>${p.display_name}</b><br/>state: ${p.atom_state}`);
        peerMarkersRef.current.set(p.id, marker);
      }

      // Draw entangle lines between excited atoms
      if (isExcited && atomState !== "ground" && !geo.loading) {
        const dist = haversineKm(geo.lat, geo.lon, p.lat, p.lon);
        if (dist < ENTANGLE_DISTANCE_KM * 3) {
          const lineColor = atomState === "entangled" || p.atom_state === "entangled" ? "#ff3366" : "#00d4ff";
          const line = L.polyline([[geo.lat, geo.lon], [p.lat, p.lon]], {
            color: lineColor,
            weight: 2,
            opacity: 0.6,
            dashArray: "6, 4",
          }).addTo(mapRef.current!);
          entangleLinesRef.current.set(p.id, line);
        }
      }
    });
  }, [nearbyPlayers, atomState, geo]);

  const canExcite = atomState === "ground";
  const decayProgress = decayTimer / RYDBERG_DURATION;

  return (
    <div className="w-screen h-screen relative" style={{ background: "#04060a" }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Screen flash */}
      {flashColor && (
        <div
          className="fixed inset-0 z-[999] pointer-events-none transition-opacity duration-300"
          style={{ background: flashColor }}
        />
      )}

      {/* Event feed */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1" style={{ maxWidth: 400 }}>
        {events.map((ev) => {
          const age = (Date.now() - ev.time) / 1000;
          const opacity = Math.max(0, 1 - age / 5);
          const borderColor = ev.type === "rydberg" ? "#00d4ff" : ev.type === "entangle" ? "#ff3366" : "#3a5068";
          return (
            <div
              key={ev.id}
              className="text-[10px] px-3 py-1 rounded"
              style={{
                opacity,
                background: "rgba(4,6,10,0.8)",
                borderLeft: `3px solid ${borderColor}`,
                color: "var(--game-white)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {ev.text}
            </div>
          );
        })}
      </div>

      {/* HUD */}
      <div className="fixed top-4 left-4 z-[1000]" style={{ fontFamily: "var(--font-display)" }}>
        <div className="text-[11px] font-bold tracking-wider" style={{ color: "var(--game-dim)" }}>
          THE RYDBERG ROOM
          <span className="ml-2 font-normal" style={{ color: "rgba(58,80,104,0.5)" }}>· GPS MAP</span>
        </div>
        <div className="h-px my-1 w-48" style={{ background: "var(--game-panel-border)" }} />
        <div className="text-[9px]" style={{ color: "rgba(58,80,104,0.5)" }}>
          {geo.loading ? "locating..." : `${geo.lat.toFixed(2)}°, ${geo.lon.toFixed(2)}°`}
          {" · "}{nearbyPlayers.length} nearby
        </div>
      </div>

      {/* Status panel */}
      <div
        className="fixed bottom-6 right-6 z-[1000] rounded-lg p-4"
        style={{
          background: "rgba(4,6,10,0.9)",
          border: "1px solid var(--game-panel-border)",
          backdropFilter: "blur(8px)",
          fontFamily: "var(--font-mono)",
          width: 220,
        }}
      >
        <div className="text-[10px] font-bold tracking-wider mb-2" style={{ color: "var(--game-white)" }}>YOUR ATOM</div>
        <div className="h-px mb-2" style={{ background: "var(--game-panel-border)" }} />

        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: "var(--game-dim)" }}>◉ state</span>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{
              background: atomState === "ground" ? "#003d1a" : atomState === "rydberg" ? "#003344" : "#3d0015",
              color: stateColors[atomState],
              border: `1px solid ${stateColors[atomState]}`,
            }}
          >
            {atomState.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: "var(--game-dim)" }}>◎ nearby</span>
          <span style={{ color: "var(--game-white)" }}>{nearbyPlayers.length} atoms</span>
        </div>

        <div className="flex justify-between text-[10px] mb-3">
          <span style={{ color: "var(--game-dim)" }}>◈ online</span>
          <span style={{ color: "var(--game-white)" }}>{players.length} total</span>
        </div>

        {/* Decay countdown bar */}
        {atomState !== "ground" && (
          <div className="mb-3">
            <div className="flex justify-between text-[9px] mb-1">
              <span style={{ color: "var(--game-dim)" }}>decay</span>
              <span style={{ color: stateColors[atomState] }}>{(decayTimer / 1000).toFixed(1)}s</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${decayProgress * 100}%`,
                  background: decayProgress > 0.5
                    ? stateColors[atomState]
                    : decayProgress > 0.25
                    ? "#ffd700"
                    : "#ff3366",
                }}
              />
            </div>
          </div>
        )}

        <div className="h-px mb-3" style={{ background: "var(--game-panel-border)" }} />

        {/* Excite button */}
        <button
          onClick={doExcite}
          disabled={!canExcite}
          className="w-full text-[10px] font-bold tracking-wider py-2.5 rounded transition-all mb-2"
          style={{
            border: `1px solid ${canExcite ? "var(--game-accent-blue)" : "var(--game-panel-border)"}`,
            borderBottom: `3px solid ${canExcite ? "var(--game-accent-blue)" : "var(--game-panel-border)"}`,
            color: canExcite ? "var(--game-accent-blue)" : "var(--game-dim)",
            background: canExcite ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.15em",
            cursor: canExcite ? "pointer" : "not-allowed",
          }}
          onMouseEnter={(e) => { if (canExcite) e.currentTarget.style.background = "rgba(0,212,255,0.15)"; }}
          onMouseLeave={(e) => { if (canExcite) e.currentTarget.style.background = "rgba(0,212,255,0.08)"; }}
        >
          [ E ] EXCITE
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full text-[10px] font-bold tracking-wider py-2 rounded transition-all"
          style={{
            border: "1px solid var(--game-panel-border)",
            color: "var(--game-dim)",
            background: "transparent",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.15em",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          ← LAB MODE
        </button>
      </div>

      {/* Proximity alert */}
      {nearbyPlayers.length > 0 && (
        <div
          className="fixed bottom-6 left-6 z-[1000] rounded-lg px-4 py-3"
          style={{
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.3)",
            fontFamily: "var(--font-mono)",
            animation: "pulse 2s infinite",
          }}
        >
          <div className="text-[11px] font-bold" style={{ color: "var(--game-accent-blue)" }}>
            ⚡ {nearbyPlayers.length} ATOM{nearbyPlayers.length > 1 ? "S" : ""} NEARBY
          </div>
          <div className="text-[9px] mt-1" style={{ color: "var(--game-dim)" }}>
            {atomState === "ground" ? "press E to excite, then approach" : "move within 100m to entangle"}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
