import { useState } from "react";
import type { GameParams } from "@/lib/types";

interface Props {
  params: GameParams;
  setParams: (p: GameParams) => void;
}

export default function ParamsPanel({ params, setParams }: Props) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof GameParams, val: number | boolean | string) => {
    setParams({ ...params, [key]: val });
  };

  return (
    <div
      className="fixed top-4 right-4 z-50"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Compact summary bar */}
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] cursor-pointer transition-all hover:border-[var(--game-cyan)]"
        style={{
          background: "rgba(4,6,10,0.9)",
          border: "1px solid var(--game-panel-border)",
          backdropFilter: "blur(8px)",
          color: "var(--game-dim)",
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: "var(--game-white)" }}>⚙</span>
        <span>blockade: {params.blockadeRadius}px</span>
        <span>·</span>
        <span>decay: {(params.rydbergDuration / 1000).toFixed(0)}s</span>
        <span>·</span>
        <span>glow: {params.glowIntensity.toFixed(1)}</span>
        <span
          className="ml-1"
          style={{ color: "var(--game-cyan)" }}
        >
          [{open ? "−" : "+"}]
        </span>
      </div>

      {open && (
        <div
          className="mt-2 w-[240px] rounded-lg p-4 space-y-4 animate-fade-in"
          style={{
            background: "rgba(4,6,10,0.95)",
            border: "1px solid var(--game-panel-border)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold tracking-[0.15em]"
              style={{ color: "var(--game-white)", fontFamily: "var(--font-display)" }}
            >
              ⚙ QUANTUM PARAMS
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] transition-colors"
              style={{ color: "var(--game-dim)" }}
            >
              [−]
            </button>
          </div>

          <div className="h-px" style={{ background: "var(--game-panel-border)" }} />

          <PSlider label="rydberg duration" value={params.rydbergDuration} min={1000} max={10000} step={500}
            display={`${(params.rydbergDuration/1000).toFixed(1)}s`} onChange={v => update("rydbergDuration", v)} />
          <PSlider label="blockade radius" value={params.blockadeRadius} min={20} max={120} step={5}
            display={`${params.blockadeRadius}px`} onChange={v => update("blockadeRadius", v)} />
          <PSlider label="connection range" value={params.connectionThreshold} min={40} max={300} step={10}
            display={`${params.connectionThreshold}px`} onChange={v => update("connectionThreshold", v)} />
          <PSlider label="glow intensity" value={params.glowIntensity} min={0.1} max={1.0} step={0.05}
            display={params.glowIntensity.toFixed(2)} onChange={v => update("glowIntensity", v)} />
          <PSlider label="decay speed" value={params.decaySpeed} min={0.1} max={3.0} step={0.1}
            display={`${params.decaySpeed.toFixed(1)}×`} onChange={v => update("decaySpeed", v)} />

          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: "var(--game-panel-border)" }}>
            <span className="text-[10px]" style={{ color: "var(--game-dim)" }}>ghost atoms</span>
            <div className="flex gap-1">
              {[true, false].map(val => (
                <button
                  key={String(val)}
                  onClick={() => update("ghostsEnabled", val)}
                  className="px-2 py-0.5 rounded text-[10px] transition-colors"
                  style={{
                    color: params.ghostsEnabled === val ? "var(--game-white)" : "var(--game-dim)",
                    background: params.ghostsEnabled === val ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                >
                  {val ? "ON" : "OFF"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PSlider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span style={{ color: "var(--game-dim)" }}>{label}</span>
        <span style={{ color: "var(--game-cyan)" }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-[2px] appearance-none rounded cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0"
        style={{
          background: `linear-gradient(to right, var(--game-cyan) 0%, var(--game-cyan) ${percent}%, var(--game-panel-border) ${percent}%, var(--game-panel-border) 100%)`,
          // @ts-ignore
          '--webkit-slider-thumb-bg': 'var(--game-cyan)',
        }}
      />
    </div>
  );
}
