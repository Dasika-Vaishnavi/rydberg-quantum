import { useEffect, useState } from "react";

export type PopupType = "excite" | "entangle" | null;

interface Props {
  type: PopupType;
  onDismiss: () => void;
}

const CONTENT: Record<string, { title: string; lines: string[] }> = {
  excite: {
    title: "⚡ you excited your atom",
    lines: [
      "laser pulse → higher energy orbital",
      "this is how rydberg states work",
    ],
  },
  entangle: {
    title: "ENTANGLED",
    lines: [
      "two rydberg atoms within blockade",
      "radius interact via dipole coupling.",
      "",
      "in a real quantum computer, this is",
      "how two-qubit gates are performed.",
      "",
      "you just performed a quantum gate.",
    ],
  },
};

export default function InfoPopup({ type, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, type === "excite" ? 4000 : 6000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  if (!type || !CONTENT[type]) return null;
  const content = CONTENT[type];

  return (
    <div
      className={`fixed z-50 font-mono text-[11px] transition-all duration-300 ${
        type === "entangle"
          ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          : "bottom-8 left-1/2 -translate-x-1/2"
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <div
        className="rounded border border-white/10 px-6 py-4 max-w-xs"
        style={{ background: "rgba(0,0,0,0.9)" }}
      >
        <div className="text-white font-bold text-xs mb-2">{content.title}</div>
        {content.lines.map((line, i) => (
          <div key={i} className={`text-white/60 ${!line ? "h-2" : ""}`}>
            {line}
          </div>
        ))}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="mt-3 text-white/30 hover:text-white/60 transition-colors text-[10px]"
        >
          [{type === "entangle" ? "got it" : "dismiss"}]
        </button>
      </div>
    </div>
  );
}
