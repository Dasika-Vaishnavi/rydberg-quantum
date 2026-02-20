import { useState, useCallback } from "react";
import AtomArray from "@/components/AtomArray";
import BlochSphere from "@/components/BlochSphere";
import StateHistogram from "@/components/StateHistogram";
import CircuitVisualizer from "@/components/CircuitVisualizer";
import ControlPanel from "@/components/ControlPanel";
import InfoPanel from "@/components/InfoPanel";
import {
  simulateRydbergBlockade,
  simulateOpticalTweezer,
  simulateVariational,
  type SimResult,
} from "@/lib/quantum";

type Mode = "rydberg" | "tweezer" | "variational";

const MODE_LABELS: Record<Mode, string> = {
  rydberg: "Rydberg Blockade",
  tweezer: "Optical Tweezers",
  variational: "QViT Variational",
};

const Index = () => {
  const [mode, setMode] = useState<Mode>("rydberg");
  const [nQubits, setNQubits] = useState(4);
  const [params, setParams] = useState([
    Math.PI / 4,
    Math.PI / 3,
    Math.PI / 6,
    Math.PI / 2,
    Math.PI / 5,
    Math.PI / 4,
    Math.PI / 3,
    Math.PI / 7,
    Math.PI / 2,
    Math.PI / 6,
    Math.PI / 4,
    Math.PI / 3,
  ]);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAtom, setSelectedAtom] = useState(0);

  const runSimulation = useCallback(() => {
    setLoading(true);
    // Simulate async feel
    setTimeout(() => {
      let res: SimResult;
      switch (mode) {
        case "rydberg":
          res = simulateRydbergBlockade(nQubits);
          break;
        case "tweezer":
          res = simulateOpticalTweezer(nQubits, params);
          break;
        case "variational":
          res = simulateVariational(nQubits, params);
          break;
      }
      setResult(res);
      setLoading(false);
    }, 300);
  }, [mode, nQubits, params]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-display font-bold gradient-quantum-text">
              The Rydberg Room
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              Neutral Atom Qubit Simulator
            </p>
          </div>
          <div className="flex gap-2">
            {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setResult(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                  mode === m
                    ? "bg-primary text-primary-foreground quantum-glow"
                    : "bg-secondary text-muted-foreground hover:bg-quantum-surface-hover"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column: Atom Array + Circuit */}
        <div className="lg:col-span-4 space-y-4">
          <AtomArray
            nQubits={nQubits}
            mode={mode}
            result={result}
            onSelectAtom={setSelectedAtom}
            selectedAtom={selectedAtom}
          />
          <CircuitVisualizer nQubits={nQubits} result={result} />
        </div>

        {/* Center: Histogram + Info */}
        <div className="lg:col-span-5 space-y-4">
          <StateHistogram result={result} />
          <InfoPanel mode={mode} />
        </div>

        {/* Right: Controls + Bloch */}
        <div className="lg:col-span-3 space-y-4">
          <ControlPanel
            nQubits={nQubits}
            setNQubits={setNQubits}
            params={params}
            setParams={setParams}
            mode={mode}
            onRun={runSimulation}
            loading={loading}
          />
          <BlochSphere selectedAtom={selectedAtom} hasResult={!!result} />
        </div>
      </main>
    </div>
  );
};

export default Index;
