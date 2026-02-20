interface Props {
  mode: string;
}

const INFO: Record<string, { title: string; body: string }> = {
  rydberg: {
    title: "Rydberg Blockade",
    body: "When an atom is excited to a Rydberg state |r⟩, its strong dipole interactions prevent neighboring atoms within the blockade radius from being excited simultaneously. This creates entanglement and enables native CZ gates — the foundation of neutral atom quantum computing.",
  },
  tweezer: {
    title: "Optical Tweezers",
    body: "Highly focused laser beams trap individual neutral atoms. By adjusting laser intensity and position, we arrange qubits in arbitrary 2D geometries and address them individually with RY rotations. Distance-dependent CRZ gates model the real van der Waals interaction.",
  },
  variational: {
    title: "Variational Circuit (QViT-style)",
    body: "Parameterized quantum circuits with trainable rotation angles, used in quantum machine learning. RX encoding and RY variational layers with CNOT entanglement — similar to Quantum Vision Transformer architectures used in medical imaging research.",
  },
};

export default function InfoPanel({ mode }: Props) {
  const info = INFO[mode] ?? INFO.rydberg;
  return (
    <div className="quantum-card rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-display font-semibold text-quantum">
        {info.title}
      </h3>
      <p className="text-xs font-mono text-muted-foreground leading-relaxed">
        {info.body}
      </p>
    </div>
  );
}
