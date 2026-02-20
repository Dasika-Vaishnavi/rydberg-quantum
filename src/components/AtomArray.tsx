import { useEffect, useRef } from "react";
import type { SimResult } from "@/lib/quantum";

interface Props {
  nQubits: number;
  mode: string;
  result: SimResult | null;
  onSelectAtom: (i: number) => void;
  selectedAtom: number;
}

export default function AtomArray({ nQubits, mode, result, onSelectAtom, selectedAtom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    let animFrame: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const cols = Math.ceil(Math.sqrt(nQubits));
      const rows = Math.ceil(nQubits / cols);
      const cellW = W / (cols + 1);
      const cellH = H / (rows + 1);

      for (let i = 0; i < nQubits; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cellW * (col + 1);
        const y = cellH * (row + 1);

        const isSelected = i === selectedAtom;
        const isExcited = result?.entanglementPairs?.some(p => p.includes(i)) ?? false;
        const pulse = Math.sin(t * 0.04 + i * 0.7) * 0.3 + 0.7;

        // Blockade radius
        if (mode === "rydberg" && isExcited) {
          ctx.beginPath();
          ctx.arc(x, y, 44, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(163, 230, 53, ${0.12 * pulse})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Entanglement lines
        if (result?.entanglementPairs) {
          for (const pair of result.entanglementPairs) {
            if (pair[0] === i && pair[1] < nQubits) {
              const j = pair[1];
              const x2 = cellW * ((j % cols) + 1);
              const y2 = cellH * (Math.floor(j / cols) + 1);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x2, y2);
              ctx.strokeStyle = `rgba(163, 230, 53, ${0.35 * pulse})`;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        }

        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, isExcited ? 22 : 16);
        if (isExcited) {
          grad.addColorStop(0, `rgba(163, 230, 53, ${0.85 * pulse})`);
          grad.addColorStop(0.5, `rgba(163, 230, 53, 0.25)`);
          grad.addColorStop(1, "transparent");
        } else {
          grad.addColorStop(0, `rgba(148, 163, 184, 0.7)`);
          grad.addColorStop(1, "transparent");
        }
        ctx.beginPath();
        ctx.arc(x, y, isExcited ? 12 : 9, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x, y, isExcited ? 6 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isExcited ? "#a3e635" : "#94a3b8";
        ctx.fill();

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, Math.PI * 2);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Labels
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`|q${i}⟩`, x, y + 28);

        if (isExcited) {
          ctx.fillStyle = "#a3e635";
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillText("|r⟩", x, y - 20);
        }
      }

      t++;
      animFrame = requestAnimationFrame(draw);
    };

    const handleClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const cols = Math.ceil(Math.sqrt(nQubits));
      const rows = Math.ceil(nQubits / cols);
      const cellW = W / (cols + 1);
      const cellH = H / (rows + 1);
      for (let i = 0; i < nQubits; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cellW * (col + 1);
        const y = cellH * (row + 1);
        if (Math.hypot(mx - x, my - y) < 22) {
          onSelectAtom(i);
          return;
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("click", handleClick);
    };
  }, [nQubits, mode, result, selectedAtom, onSelectAtom]);

  return (
    <div className="quantum-card rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">Atom Array — click to select</span>
        <span className="text-xs font-mono text-quantum">{nQubits} qubits</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full cursor-pointer"
        style={{ height: 260 }}
      />
    </div>
  );
}
