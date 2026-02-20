import { useEffect, useState, useCallback } from "react";

export interface GameEvent {
  id: string;
  text: string;
  type: "rydberg" | "entangle" | "decay";
  timestamp: number;
}

interface Props {
  events: GameEvent[];
}

export default function EventFeed({ events }: Props) {
  const [visible, setVisible] = useState<GameEvent[]>([]);

  useEffect(() => {
    setVisible(events.slice(-3));
  }, [events]);

  if (visible.length === 0) return null;

  const now = Date.now();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-0.5 items-center max-w-[420px] w-full px-4">
      {visible.map((ev) => {
        const age = (now - ev.timestamp) / 1000;
        const opacity = Math.max(0, 1 - age / 4);

        const borderColor =
          ev.type === "entangle"
            ? "var(--game-red)"
            : ev.type === "rydberg"
            ? "var(--game-cyan)"
            : "var(--game-dim)";

        return (
          <div
            key={ev.id}
            className="w-full py-1 px-3 rounded text-[10px] animate-fade-in-down transition-opacity"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(4,6,10,0.7)",
              borderLeft: `3px solid ${borderColor}`,
              color: "var(--game-white)",
              opacity,
            }}
          >
            {ev.text}
            <span className="ml-2" style={{ color: "var(--game-dim)" }}>
              {age < 1 ? "now" : `${age.toFixed(0)}s ago`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

let eventCounter = 0;
export function createEvent(text: string, type: GameEvent["type"]): GameEvent {
  return {
    id: `ev-${eventCounter++}-${Date.now()}`,
    text,
    type,
    timestamp: Date.now(),
  };
}
