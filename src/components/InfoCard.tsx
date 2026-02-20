import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOPICS = [
  {
    title: "Neutral Atoms as Qubits",
    body: "Individual neutral atoms (like rubidium or cesium) are used as qubits. Their ground state represents |0⟩ and a highly excited Rydberg state represents |1⟩. Unlike trapped ions, neutral atoms have no net electric charge, making them naturally resistant to certain types of noise.",
  },
  {
    title: "Optical Tweezers",
    body: "Tightly focused laser beams create microscopic traps that can hold individual atoms. By arranging many tweezers in arrays, researchers create programmable qubit geometries — grids, rings, or arbitrary 2D/3D patterns. The trap you see around each atom represents this optical tweezer.",
  },
  {
    title: "Rydberg Blockade",
    body: "When an atom is laser-excited to a Rydberg state (very high principal quantum number, n ≈ 50-100), its electron orbit becomes enormous — thousands of times larger than ground state. This creates strong dipole-dipole interactions: if one atom is in |r⟩, nearby atoms within the blockade radius cannot be excited. This IS the native two-qubit gate mechanism.",
  },
  {
    title: "Entanglement via Blockade",
    body: "The Rydberg blockade naturally creates entanglement. When two atoms are within blockade range and a global laser pulse is applied, the system evolves into a superposition |01⟩ + |10⟩ — an entangled Bell state. This is fundamentally different from how superconducting qubits or trapped ions create entanglement.",
  },
  {
    title: "Decoherence & T1 Times",
    body: "The countdown ring around excited atoms represents coherence time (T1). Rydberg states spontaneously decay back to ground state — this is decoherence. Real neutral atom qubits have coherence times of ~milliseconds for Rydberg states and ~seconds for hyperfine ground states. The decay speed slider lets you explore how fragile quantum states are.",
  },
];

export default function InfoCard({ open, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!open) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 font-mono text-[11px] animate-fade-in"
      style={{ background: "rgba(0,0,0,0.95)" }}
    >
      <div className="max-w-2xl mx-auto p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="text-white/40 uppercase tracking-widest text-[9px]">
            neutral atom quantum computing
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-xs"
          >
            [close]
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {TOPICS.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                i === activeIdx
                  ? "bg-white/15 text-white"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        <div className="text-white/70 leading-relaxed max-h-32 overflow-y-auto">
          {TOPICS[activeIdx].body}
        </div>
      </div>
    </div>
  );
}
