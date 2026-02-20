interface Props {
  nQubits: number;
  setNQubits: (n: number) => void;
  params: number[];
  setParams: (p: number[]) => void;
  mode: string;
  onRun: () => void;
  loading: boolean;
}

export default function ControlPanel({
  nQubits,
  setNQubits,
  params,
  setParams,
  mode,
  onRun,
  loading,
}: Props) {
  return (
    <div className="quantum-card rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-display font-semibold text-foreground">Controls</h3>

      <div className="space-y-1">
        <label className="text-xs font-mono text-muted-foreground">
          Qubits: {nQubits}
        </label>
        <input
          type="range"
          min={2}
          max={6}
          value={nQubits}
          onChange={e => setNQubits(+e.target.value)}
          className="w-full accent-primary h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {params.slice(0, Math.min(4, nQubits)).map((p, i) => (
        <div key={i} className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">
            {mode === "tweezer" ? `Laser θ${i}` : `Param θ${i}`}: {p.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={Math.PI * 2}
            step={0.01}
            value={p}
            onChange={e => {
              const next = [...params];
              next[i] = +e.target.value;
              setParams(next);
            }}
            className="w-full accent-primary h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
          />
        </div>
      ))}

      <button
        onClick={onRun}
        disabled={loading}
        className="w-full py-2.5 rounded-lg font-display font-semibold text-sm bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50 quantum-glow"
      >
        {loading ? "Simulating..." : "▶ Run Simulation"}
      </button>

      <p className="text-[10px] font-mono text-muted-foreground text-center">
        TypeScript quantum engine • No backend required
      </p>
    </div>
  );
}
