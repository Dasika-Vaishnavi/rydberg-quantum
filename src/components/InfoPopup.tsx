import { useEffect, useState } from "react";

export type PopupType = "excite" | "entangle" | null;

interface Props {
  type: PopupType;
  onDismiss: () => void;
  onLearnMore?: () => void;
}

export default function InfoPopup({ type, onDismiss, onLearnMore }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 400);
      }, type === "excite" ? 6000 : 8000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [type, onDismiss]);

  if (!type) return null;

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 400);
  };

  if (type === "excite") {
    return (
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] max-w-[360px] w-full px-4 transition-all duration-400 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div
          className="rounded-lg p-5"
          style={{
            background: "rgba(4,6,10,0.95)",
            borderLeft: "3px solid var(--game-cyan)",
            border: "1px solid var(--game-panel-border)",
            borderLeftWidth: "3px",
            borderLeftColor: "var(--game-cyan)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div className="text-[12px] font-bold mb-3" style={{ color: "var(--game-cyan)" }}>
            ⚡ RYDBERG STATE ACHIEVED
          </div>
          <div className="h-px mb-3" style={{ background: "var(--game-panel-border)" }} />
          <div className="text-[11px] leading-relaxed space-y-2" style={{ color: "var(--game-white)" }}>
            <p>Your outermost electron just jumped to a high-energy orbital — 1000× its normal distance from the nucleus.</p>
            <p style={{ color: "var(--game-dim)" }}>In a real quantum computer, this is done with a precisely tuned laser.</p>
          </div>
          <button
            onClick={dismiss}
            className="mt-4 text-[10px] tracking-wider transition-colors"
            style={{ color: "var(--game-dim)" }}
          >
            [got it →]
          </button>
        </div>
      </div>
    );
  }

  // Entangle popup — center modal
  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center transition-all duration-400 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="max-w-[400px] w-full mx-4 rounded-lg p-6"
        style={{
          background: "rgba(4,6,10,0.95)",
          border: "1px solid var(--game-panel-border)",
          borderLeftWidth: "3px",
          borderLeftColor: "var(--game-red)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div className="text-[13px] font-bold text-center mb-4" style={{ color: "var(--game-red)" }}>
          🔴 ENTANGLEMENT EVENT
        </div>
        <div className="h-px mb-4" style={{ background: "var(--game-panel-border)" }} />
        <div className="text-[11px] leading-relaxed space-y-3" style={{ color: "var(--game-white)" }}>
          <p>Two Rydberg atoms entered each other's blockade radius.</p>
          <p>Their dipole fields now prevent independent excitation — they share a quantum state.</p>
          <p style={{ color: "var(--game-cyan)" }}>You just performed a 2-qubit gate. This is how quantum computers work.</p>
        </div>
        <div className="h-px my-4" style={{ background: "var(--game-panel-border)" }} />
        <div className="text-[10px] space-y-1" style={{ color: "var(--game-dim)" }}>
          <div>temperature: ~10 µK</div>
          <div>gate fidelity: ~99.5% (QuEra, 2023)</div>
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={dismiss} className="text-[10px] tracking-wider" style={{ color: "var(--game-dim)" }}>
            [close]
          </button>
          {onLearnMore && (
            <button
              onClick={() => { dismiss(); onLearnMore(); }}
              className="text-[10px] tracking-wider"
              style={{ color: "var(--game-cyan)" }}
            >
              [learn more →]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
