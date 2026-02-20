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
      className="fixed top-4 right-4 z-50 font-mono text-[11px]"
      style={{ color: "#fff" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 border border-white/10 rounded bg-black/80 hover:bg-white/5 transition-colors"
      >
        {open ? "⚙ params [ − ]" : "⚙ params"}
      </button>

      {open && (
        <div
          className="mt-2 w-52 rounded border border-white/10 p-3 space-y-3"
          style={{ background: "rgba(0,0,0,0.9)" }}
        >
          <div className="text-[10px] text-white/40 uppercase tracking-widest">
            quantum params
          </div>

          <Slider
            label="rydberg duration"
            value={params.rydbergDuration}
            min={1000}
            max={10000}
            step={500}
            display={`${params.rydbergDuration}ms`}
            onChange={(v) => update("rydbergDuration", v)}
          />
          <Slider
            label="entangle duration"
            value={params.entangleDuration}
            min={1000}
            max={10000}
            step={500}
            display={`${params.entangleDuration}ms`}
            onChange={(v) => update("entangleDuration", v)}
          />
          <Slider
            label="orbit radius"
            value={params.orbitRadius}
            min={20}
            max={120}
            step={5}
            display={`${params.orbitRadius}px`}
            onChange={(v) => update("orbitRadius", v)}
          />
          <Slider
            label="connection threshold"
            value={params.connectionThreshold}
            min={40}
            max={300}
            step={10}
            display={`${params.connectionThreshold}px`}
            onChange={(v) => update("connectionThreshold", v)}
          />
          <Slider
            label="glow intensity"
            value={params.glowIntensity}
            min={0.1}
            max={1.0}
            step={0.05}
            display={params.glowIntensity.toFixed(2)}
            onChange={(v) => update("glowIntensity", v)}
          />
          <Slider
            label="decay speed"
            value={params.decaySpeed}
            min={0.1}
            max={3.0}
            step={0.1}
            display={`${params.decaySpeed.toFixed(1)}x`}
            onChange={(v) => update("decaySpeed", v)}
          />

          <div className="flex justify-between items-center pt-1 border-t border-white/10">
            <span className="text-white/50">ghost atoms</span>
            <div className="flex gap-1">
              <button
                onClick={() => update("ghostsEnabled", true)}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  params.ghostsEnabled ? "bg-white/20 text-white" : "text-white/30"
                }`}
              >
                ON
              </button>
              <button
                onClick={() => update("ghostsEnabled", false)}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  !params.ghostsEnabled ? "bg-white/20 text-white" : "text-white/30"
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/50">crosshair</span>
            <div className="flex gap-1">
              <button
                onClick={() => update("crosshairStyle", "laser")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  params.crosshairStyle === "laser" ? "bg-white/20 text-white" : "text-white/30"
                }`}
              >
                laser
              </button>
              <button
                onClick={() => update("crosshairStyle", "dot")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  params.crosshairStyle === "dot" ? "bg-white/20 text-white" : "text-white/30"
                }`}
              >
                dot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-white/50">
        <span>{label}</span>
        <span className="text-white/70">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none bg-white/10 rounded cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
    </div>
  );
}
