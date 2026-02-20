import { useEffect, useRef } from "react";

interface Props {
  selectedAtom: number;
  hasResult: boolean;
}

export default function BlochSphere({ selectedAtom, hasResult }: Props) {
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

    let t = 0;
    let animFrame: number;

    const draw = () => {
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.36;

      ctx.clearRect(0, 0, W, H);

      // Sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Equator
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.22, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#374151";
      ctx.stroke();

      // Meridian
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.22, R, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#2d3748";
      ctx.stroke();

      // Axis labels
      const labels: [number, number, string][] = [
        [0, -R * 1.18, "|0⟩"],
        [0, R * 1.18, "|1⟩"],
        [R * 1.18, 0, "|+⟩"],
        [-R * 1.18, 0, "|−⟩"],
      ];
      labels.forEach(([dx, dy, label]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.strokeStyle = "#4b5563";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = "#6b7280";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, cx + dx * 1.1, cy + dy * 1.1 + 4);
      });

      // State vector
      const theta = hasResult ? Math.PI / 3 : Math.PI / 4 + Math.sin(t * 0.015) * 0.4;
      const phi = t * 0.025;
      const vx = R * Math.sin(theta) * Math.cos(phi);
      const vy = -R * Math.cos(theta);

      // Trail
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.04) {
        const tx = cx + R * Math.sin(theta) * Math.cos(a);
        const ty2 = cy - R * Math.cos(theta);
        if (a === 0) ctx.moveTo(tx, ty2);
        else ctx.lineTo(tx, ty2);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(163,230,53,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Arrow
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + vx, cy + vy);
      ctx.strokeStyle = "#a3e635";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Tip
      ctx.beginPath();
      ctx.arc(cx + vx, cy + vy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#a3e635";
      ctx.fill();

      // Glow at tip
      const glow = ctx.createRadialGradient(cx + vx, cy + vy, 0, cx + vx, cy + vy, 12);
      glow.addColorStop(0, "rgba(163,230,53,0.3)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(cx + vx - 12, cy + vy - 12, 24, 24);

      ctx.fillStyle = "#a3e635";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`|q${selectedAtom}⟩`, cx + vx + 10, cy + vy + 4);

      t++;
      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [selectedAtom, hasResult]);

  return (
    <div className="quantum-card rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">Bloch Sphere</span>
        <span className="text-xs font-mono text-quantum">qubit {selectedAtom}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 220 }}
      />
    </div>
  );
}
