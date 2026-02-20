import { useState } from "react";

interface Props {
  onStart: () => void;
}

export default function OnboardingOverlay({ onStart }: Props) {
  const [fading, setFading] = useState(false);

  const handleStart = () => {
    setFading(true);
    setTimeout(onStart, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-[600ms] ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "rgba(4,6,10,0.95)" }}
    >
      <div className="w-full max-w-[400px] mx-4">
        <div
          className="rounded-2xl border p-8 animate-fade-in"
          style={{
            borderColor: "var(--game-panel-border)",
            background: "var(--game-bg2)",
          }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "var(--game-cyan)", boxShadow: "0 0 8px var(--game-cyan)" }}
            />
            <span
              className="text-sm font-bold tracking-wider"
              style={{ fontFamily: "var(--font-display)", color: "var(--game-white)" }}
            >
              THE RYDBERG ROOM
            </span>
          </div>
          <div
            className="text-[10px] mb-6 tracking-widest"
            style={{ fontFamily: "var(--font-display)", color: "var(--game-dim)" }}
          >
            experiment #0047
          </div>

          <div className="w-full h-px mb-6" style={{ background: "var(--game-panel-border)" }} />

          {/* Description */}
          <div className="space-y-3 mb-6 text-[12px] leading-relaxed" style={{ color: "var(--game-white)" }}>
            <p>You are a neutral atom.</p>
            <p>Trapped in an optical tweezer.<br />Held still by laser light.</p>
            <p>
              Press{" "}
              <kbd
                className="inline-block px-2 py-0.5 rounded text-[11px] mx-0.5"
                style={{
                  border: "1px solid var(--game-panel-border)",
                  borderBottom: "3px solid var(--game-panel-border)",
                  color: "var(--game-cyan)",
                }}
              >
                E
              </kbd>{" "}
              to excite yourself into a Rydberg state.
            </p>
            <p>
              Move close to another excited atom to create entanglement — the basis of quantum computation.
            </p>
          </div>

          <div className="w-full h-px mb-5" style={{ background: "var(--game-panel-border)" }} />

          {/* Controls */}
          <div className="mb-6 text-[11px] space-y-2" style={{ color: "var(--game-dim)" }}>
            <div className="font-bold tracking-wider text-[10px] mb-3" style={{ color: "var(--game-white)" }}>
              CONTROLS
            </div>
            <div className="flex justify-between">
              <span>mouse</span>
              <span style={{ color: "var(--game-white)" }}>move your atom</span>
            </div>
            <div className="flex justify-between">
              <span>E / click</span>
              <span style={{ color: "var(--game-white)" }}>excite / fire laser</span>
            </div>
          </div>

          <div className="w-full h-px mb-5" style={{ background: "var(--game-panel-border)" }} />

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-lg text-[12px] font-bold tracking-[0.15em] transition-all duration-200 hover:shadow-lg"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--game-cyan)",
              border: "1px solid var(--game-cyan)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,212,255,0.08)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0,212,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ENTER THE EXPERIMENT
          </button>
        </div>

        <p className="text-center mt-4 text-[10px]" style={{ color: "var(--game-dim)" }}>
          open multiple tabs to play with others
        </p>
      </div>
    </div>
  );
}
