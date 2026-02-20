import type { Atom, GameParams } from "./types";
import { pixelDistance } from "./geo";

const BLUE = "#3b82f6";
const RED = "#ef4444";

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: { x: number; y: number }[],
  w: number,
  h: number
) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawConnectionLines(
  ctx: CanvasRenderingContext2D,
  atoms: Atom[],
  params: GameParams,
  t: number
) {
  ctx.save();
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a = atoms[i];
      const b = atoms[j];
      const dist = pixelDistance(a.x, a.y, b.x, b.y);

      // Entangled pair — red line
      if (a.state === "entangled" && b.state === "entangled" && a.entangledWith === b.id) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(239,68,68,0.6)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Pulse dot
        const pulsePos = (Math.sin(t * 0.006) + 1) / 2;
        const px = a.x + (b.x - a.x) * pulsePos;
        const py = a.y + (b.y - a.y) * pulsePos;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.fill();
      }
      // Both rydberg within threshold — blue line
      else if (
        a.state === "rydberg" && b.state === "rydberg" &&
        dist < params.connectionThreshold
      ) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(59,130,246,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const pulsePos = (Math.sin(t * 0.004) + 1) / 2;
        const px = a.x + (b.x - a.x) * pulsePos;
        const py = a.y + (b.y - a.y) * pulsePos;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = BLUE;
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

export function drawOrbitRings(
  ctx: CanvasRenderingContext2D,
  atom: Atom,
  params: GameParams
) {
  ctx.save();
  // Outer orbit
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, params.orbitRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(80,80,80,0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner orbit
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, params.orbitRadius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(60,60,60,0.2)";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

export function drawBlockadeZone(
  ctx: CanvasRenderingContext2D,
  atom: Atom,
  params: GameParams,
  t: number
) {
  if (atom.state !== "rydberg" && atom.state !== "entangled") return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, params.blockadeRadius, 0, Math.PI * 2);
  const color = atom.state === "entangled" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);
  ctx.lineDashOffset = t * 0.2;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("blockade radius", atom.x, atom.y - params.blockadeRadius - 4);
  ctx.restore();
}

export function drawAtom(
  ctx: CanvasRenderingContext2D,
  atom: Atom,
  params: GameParams,
  t: number
) {
  const { x, y, state } = atom;
  const pulse = Math.sin(t * 0.004 + parseFloat(atom.id.slice(-4)) * 0.1) * 0.3 + 0.7;

  // Lerp orbit radius
  atom.orbitRadius += (atom.targetOrbitRadius - atom.orbitRadius) * 0.05;

  ctx.save();
  if (state === "ground") {
    // Faint glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 18);
    grad.addColorStop(0, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Nucleus
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * pulse})`;
    ctx.fill();

    // Orbital electron
    atom.orbitAngle += 0.002;
    const ex = x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
    const ey = y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(ex, ey, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
  } else if (state === "rydberg") {
    // Bright glow layers
    const grad1 = ctx.createRadialGradient(x, y, 0, x, y, 40);
    grad1.addColorStop(0, `rgba(59,130,246,${0.5 * params.glowIntensity * pulse})`);
    grad1.addColorStop(0.6, `rgba(59,130,246,${0.15 * params.glowIntensity})`);
    grad1.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = grad1;
    ctx.fill();

    // Pulsing ring
    const ringR = 20 + Math.sin(t * 0.005) * 6;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(59,130,246,${0.6 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nucleus
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = BLUE;
    ctx.fill();

    // Orbital electron — larger, faster
    atom.orbitAngle += 0.008;
    const ex = x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
    const ey = y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = BLUE;
    ctx.fill();

    // Decay countdown ring
    const maxDur = params.rydbergDuration;
    const fraction = atom.stateTimer / maxDur;
    ctx.beginPath();
    ctx.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
    ctx.strokeStyle = "rgba(59,130,246,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Caption
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("rydberg state", x, y + 42);
  } else if (state === "entangled") {
    // Red glow
    const grad1 = ctx.createRadialGradient(x, y, 0, x, y, 40);
    grad1.addColorStop(0, `rgba(239,68,68,${0.6 * params.glowIntensity * pulse})`);
    grad1.addColorStop(0.6, `rgba(239,68,68,${0.2 * params.glowIntensity})`);
    grad1.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = grad1;
    ctx.fill();

    // Pulsing ring — faster
    const ringR = 20 + Math.sin(t * 0.008) * 8;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,68,68,${0.7 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nucleus
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = RED;
    ctx.fill();

    // Orbital electron
    atom.orbitAngle += 0.01;
    const ex = x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
    const ey = y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = RED;
    ctx.fill();

    // Decay ring
    const maxDur = params.entangleDuration;
    const fraction = atom.stateTimer / maxDur;
    ctx.beginPath();
    ctx.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
    ctx.strokeStyle = "rgba(239,68,68,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Caption
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("entangled", x, y + 42);
  }

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(atom.label, x, y + 55);

  ctx.restore();
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  atom: Atom,
  style: 'laser' | 'dot'
) {
  const { x, y } = atom;
  ctx.save();

  if (style === 'dot') {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(239,68,68,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  const gap = 10;
  const len = 30;
  ctx.strokeStyle = "rgba(239,68,68,0.65)";
  ctx.lineWidth = 1;

  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(x - gap - len, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + gap + len, y);
  ctx.stroke();

  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(x, y - gap - len);
  ctx.lineTo(x, y - gap);
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + gap + len);
  ctx.stroke();

  // Corner ticks
  const tickLen = 5;
  const corners = [
    [x - gap - len, y, 0, -tickLen],
    [x + gap + len, y, 0, -tickLen],
    [x, y - gap - len, -tickLen, 0],
    [x, y + gap + len, -tickLen, 0],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();
  }

  ctx.restore();
}
