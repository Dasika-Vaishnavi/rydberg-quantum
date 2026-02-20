import { useState, useEffect, useRef } from "react";

export type GameMilestone =
  | "start"         // just entered, intro playing
  | "move"          // intro done, hasn't moved much
  | "excite"        // moved, hasn't pressed E yet
  | "decayed"       // excited once, decayed back
  | "find_target"   // needs to find another rydberg atom
  | "entangle"      // entangled for the first time
  | "free_play"     // all tutorials done
  ;

interface Props {
  milestone: GameMilestone;
  atomState: "ground" | "rydberg" | "entangled";
  introPhase: string;
}

const PROMPTS: Record<GameMilestone, { text: string; sub?: string; icon: string; pulse?: boolean }> = {
  start: {
    icon: "◉",
    text: "your atom is being deployed...",
    sub: "watch as you're placed on the world map",
  },
  move: {
    icon: "↔",
    text: "move your mouse to control your atom",
    sub: "you're trapped in an optical tweezer — the laser follows you",
    pulse: true,
  },
  excite: {
    icon: "⚡",
    text: "press E to fire a laser pulse",
    sub: "this excites your electron into a high-energy Rydberg orbit",
    pulse: true,
  },
  decayed: {
    icon: "↻",
    text: "your state decayed — quantum states are fragile",
    sub: "press E again, then move toward a glowing atom before it fades",
  },
  find_target: {
    icon: "◎",
    text: "move toward another glowing atom",
    sub: "when two Rydberg atoms overlap → entanglement (a quantum gate)",
    pulse: true,
  },
  entangle: {
    icon: "🔴",
    text: "you created entanglement!",
    sub: "you just performed a 2-qubit gate — the core of quantum computing",
  },
  free_play: {
    icon: "∞",
    text: "experiment freely",
    sub: "try the ⚙ params panel · open another tab for real multiplayer",
  },
};

export default function GuidedPrompts({ milestone, atomState, introPhase }: Props) {
  const [show, setShow] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(milestone);
  const [fadeClass, setFadeClass] = useState("opacity-0 translate-y-2");
  const prevMilestone = useRef(milestone);

  // Transition animation on milestone change
  useEffect(() => {
    if (milestone !== prevMilestone.current) {
      // Fade out
      setFadeClass("opacity-0 translate-y-2");
      const t = setTimeout(() => {
        setCurrentMilestone(milestone);
        setShow(true);
        // Fade in
        setTimeout(() => setFadeClass("opacity-100 translate-y-0"), 50);
      }, 400);
      prevMilestone.current = milestone;
      return () => clearTimeout(t);
    } else if (!show) {
      setCurrentMilestone(milestone);
      setShow(true);
      setTimeout(() => setFadeClass("opacity-100 translate-y-0"), 100);
    }
  }, [milestone, show]);

  // Auto-hide free_play after 8s
  useEffect(() => {
    if (currentMilestone === "free_play") {
      const t = setTimeout(() => setFadeClass("opacity-0 translate-y-2"), 8000);
      return () => clearTimeout(t);
    }
  }, [currentMilestone]);

  // Hide during intro "loading"/"locating" phases — show "start" prompt during deploy
  if (introPhase === "loading" || introPhase === "locating") return null;

  const prompt = PROMPTS[currentMilestone];
  if (!prompt) return null;

  const borderColor =
    currentMilestone === "entangle" ? "var(--game-red)" :
    currentMilestone === "excite" || currentMilestone === "find_target" ? "var(--game-cyan)" :
    "var(--game-panel-border)";

  const iconColor =
    currentMilestone === "entangle" ? "var(--game-red)" :
    currentMilestone === "excite" || currentMilestone === "find_target" ? "var(--game-cyan)" :
    currentMilestone === "free_play" ? "var(--game-gold)" :
    "var(--game-white)";

  return (
    <div
      className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] max-w-[380px] w-full px-4 transition-all duration-500 ${fadeClass}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div
        className="rounded-lg px-5 py-4 flex items-start gap-3"
        style={{
          background: "rgba(4,6,10,0.85)",
          border: `1px solid ${borderColor}`,
          borderLeftWidth: "3px",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Icon */}
        <span
          className={`text-lg mt-0.5 ${prompt.pulse ? "animate-pulse" : ""}`}
          style={{ color: iconColor }}
        >
          {prompt.icon}
        </span>

        <div className="flex-1 min-w-0">
          {/* Main text */}
          <div className="text-[12px] font-bold" style={{ color: "var(--game-white)" }}>
            {prompt.text}
          </div>
          {/* Sub text */}
          {prompt.sub && (
            <div className="text-[10px] mt-1 leading-relaxed" style={{ color: "var(--game-dim)" }}>
              {prompt.sub}
            </div>
          )}

          {/* Contextual key hint */}
          {(currentMilestone === "excite" || currentMilestone === "decayed" || currentMilestone === "find_target") && (
            <div className="mt-2 flex items-center gap-2">
              <kbd
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                style={{
                  border: "1px solid var(--game-cyan)",
                  borderBottom: "3px solid var(--game-cyan)",
                  color: "var(--game-cyan)",
                }}
              >
                E
              </kbd>
              <span className="text-[9px]" style={{ color: "var(--game-dim)" }}>
                {atomState === "ground" ? "ready to fire" : "cooling down..."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
