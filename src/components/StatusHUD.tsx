import type { Atom } from "@/lib/types";

interface Props {
  userAtom: Atom | null;
  atomCount: number;
  nearbyLinks: number;
  onExcite: () => void;
}

export default function StatusHUD({ userAtom, atomCount, nearbyLinks, onExcite }: Props) {
  const state = userAtom?.state ?? "ground";
  const timer = userAtom?.stateTimer ?? 0;
  const canExcite = state === "ground";

  const stateColors: Record<string, { bg: string; text: string; border: string }> = {
    ground: { bg: "#003d1a", text: "#00ff88", border: "#00ff88" },
    rydberg: { bg: "#003344", text: "#00d4ff", border: "#00d4ff" },
    entangled: { bg: "#3d0015", text: "#ff3366", border: "#ff3366" },
  };

  const sc = stateColors[state] || stateColors.ground;

  // Timer bar
  const maxDur = state === "rydberg" ? 5000 : state === "entangled" ? 5000 : 0;
  const barPercent = maxDur > 0 ? (timer / maxDur) * 100 : 0;
  const barHue = 180 * (barPercent / 100); // cyan→red

  return (
    <div
      className="fixed bottom-6 right-6 z-50 select-none"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div
        className="rounded-lg p-4 w-[210px]"
        style={{
          background: "rgba(4,6,10,0.9)",
          border: "1px solid var(--game-panel-border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="text-[10px] font-bold tracking-[0.15em] mb-3"
          style={{ color: "var(--game-gold)", fontFamily: "var(--font-display)" }}
        >
          YOUR ATOM
        </div>

        <div className="h-px mb-3" style={{ background: "var(--game-panel-border)" }} />

        {/* State */}
        <div className="flex items-center justify-between mb-2 text-[11px]">
          <span style={{ color: "var(--game-dim)" }}>◉ state</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
              state === "rydberg" ? "animate-pulse-cyan" : state === "entangled" ? "animate-pulse-red" : ""
            }`}
            style={{
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}`,
            }}
          >
            {state.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2 text-[11px]">
          <span style={{ color: "var(--game-dim)" }}>◎ links</span>
          <span style={{ color: "var(--game-white)" }}>{nearbyLinks}</span>
        </div>

        <div className="flex items-center justify-between mb-3 text-[11px]">
          <span style={{ color: "var(--game-dim)" }}>◈ online</span>
          <span style={{ color: "var(--game-white)" }}>{atomCount} atoms</span>
        </div>

        <div className="h-px mb-3" style={{ background: "var(--game-panel-border)" }} />

        {/* Excite button */}
        <button
          onClick={onExcite}
          disabled={!canExcite}
          className="w-full py-2 rounded text-[11px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            fontFamily: "var(--font-display)",
            background: canExcite ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${canExcite ? "var(--game-cyan)" : "var(--game-panel-border)"}`,
            borderBottom: `3px solid ${canExcite ? "var(--game-cyan)" : "var(--game-panel-border)"}`,
            color: canExcite ? "var(--game-cyan)" : "var(--game-dim)",
            cursor: canExcite ? "pointer" : "not-allowed",
          }}
        >
          <kbd
            className="inline-block px-1.5 py-0.5 rounded text-[10px]"
            style={{
              border: `1px solid ${canExcite ? "var(--game-cyan)" : "var(--game-dim)"}`,
              borderBottom: `2px solid ${canExcite ? "var(--game-cyan)" : "var(--game-dim)"}`,
            }}
          >
            E
          </kbd>
          EXCITE
        </button>

        {/* Timer bar */}
        {state !== "ground" && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span style={{ color: "var(--game-dim)" }}>decay</span>
              <span style={{ color: `hsl(${barHue}, 100%, 60%)` }}>
                {(timer / 1000).toFixed(1)}s
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${barPercent}%`,
                  background: `hsl(${barHue}, 100%, 60%)`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
