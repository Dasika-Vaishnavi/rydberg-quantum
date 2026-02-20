import type { Atom, GameParams } from "./types";
import { pixelDistance } from "./geo";

const CYAN = "#00d4ff";
const RED = "#ff3366";
const WHITE = "#e8f4f8";
const GOLD = "#ffd700";
const DIM = "#3a5068";
const GRID_COLOR = "#0d1520";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  ctx.save();
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: { x: number; y: number }[],
  w: number,
  h: number
) {
  ctx.save();
  for (const s of stars) {
    const brightness = 0.1 + Math.random() * 0.1;
    ctx.fillStyle = `rgba(232,244,248,${brightness})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, 0.6 + Math.random() * 0.4, 0, Math.PI * 2);
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

      if (a.state === "entangled" && b.state === "entangled" && a.entangledWith === b.id) {
        // Triple-line red beam
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,51,102,0.08)"; ctx.lineWidth = 6; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,51,102,0.4)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 0.5; ctx.stroke();

        // Two pulse dots
        const p1 = (Math.sin(t * 0.006) + 1) / 2;
        const p2 = (Math.sin(t * 0.006 + Math.PI) + 1) / 2;
        for (const pos of [p1, p2]) {
          const px = a.x + (b.x - a.x) * pos;
          const py = a.y + (b.y - a.y) * pos;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
        }

        // Midpoint label
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillStyle = "rgba(255,51,102,0.5)";
        ctx.font = "8px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("entangled pair", mx, my - 8);
      } else if (
        a.state === "rydberg" && b.state === "rydberg" &&
        dist < params.connectionThreshold
      ) {
        // Triple-line cyan beam
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(0,212,255,0.08)"; ctx.lineWidth = 5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(0,212,255,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 0.5; ctx.stroke();

        const pulsePos = (Math.sin(t * 0.004) + 1) / 2;
        const px = a.x + (b.x - a.x) * pulsePos;
        const py = a.y + (b.y - a.y) * pulsePos;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        // Midpoint label
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillStyle = "rgba(0,212,255,0.5)";
        ctx.font = "8px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("dipole interaction", mx, my - 8);
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
  ctx.strokeStyle = atom.isUser ? "rgba(0,212,255,0.2)" : "rgba(58,80,104,0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner orbit
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, params.orbitRadius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(58,80,104,0.15)";
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
  const isRed = atom.state === "entangled";
  ctx.strokeStyle = isRed ? "rgba(255,51,102,0.15)" : "rgba(0,212,255,0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 8]);
  ctx.lineDashOffset = t * 0.2;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = isRed ? "rgba(255,51,102,0.3)" : "rgba(0,212,255,0.3)";
  ctx.font = "8px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("blockade zone", atom.x, atom.y - params.blockadeRadius - 5);
  ctx.restore();
}

export function drawAtom(
  ctx: CanvasRenderingContext2D,
  atom: Atom,
  params: GameParams,
  t: number,
  flashScale: number = 1
) {
  const { x, y, state } = atom;
  const idHash = atom.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pulse = Math.sin(t * 0.004 + idHash * 0.1) * 0.3 + 0.7;

  atom.orbitRadius += (atom.targetOrbitRadius - atom.orbitRadius) * 0.05;

  const scale = atom.isUser ? flashScale : 1;

  ctx.save();

  if (state === "ground") {
    // Glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 20);
    grad.addColorStop(0, `rgba(232,244,248,0.3)`);
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Nucleus — bright, visible
    ctx.beginPath();
    ctx.arc(x, y, 7 * scale, 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();

    // Green alive indicator
    ctx.beginPath();
    ctx.arc(x + 8, y - 8, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff88";
    ctx.fill();

    // Orbital electron
    atom.orbitAngle += 0.003;
    const ex = x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
    const ey = y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = CYAN;
    ctx.fill();

  } else if (state === "rydberg") {
    // Outer glow
    const grad3 = ctx.createRadialGradient(x, y, 0, x, y, 70);
    grad3.addColorStop(0, `rgba(0,212,255,${0.08 * params.glowIntensity})`);
    grad3.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fillStyle = grad3;
    ctx.fill();

    // Mid glow
    const grad2 = ctx.createRadialGradient(x, y, 0, x, y, 40);
    grad2.addColorStop(0, `rgba(0,212,255,${0.3 * params.glowIntensity * pulse})`);
    grad2.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = grad2;
    ctx.fill();

    // Core glow
    const grad1 = ctx.createRadialGradient(x, y, 0, x, y, 22);
    grad1.addColorStop(0, `rgba(0,212,255,${0.8 * params.glowIntensity * pulse})`);
    grad1.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = grad1;
    ctx.fill();

    // Pulsing rings
    const ringR1 = 28 + Math.sin(t * 0.008) * 5;
    ctx.beginPath();
    ctx.arc(x, y, ringR1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,212,255,${0.7 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const ringR2 = 50 + Math.sin(t * 0.005) * 8;
    ctx.beginPath();
    ctx.arc(x, y, ringR2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,212,255,${0.3 * pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nucleus
    ctx.beginPath();
    ctx.arc(x, y, 9 * scale, 0, Math.PI * 2);
    ctx.fillStyle = CYAN;
    ctx.fill();

    // Primary orbital electron
    atom.orbitAngle += 0.012;
    const ex = x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
    const ey = y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = CYAN;
    ctx.fill();

    // Ghost electron
    const gx = x + Math.cos(atom.orbitAngle + Math.PI) * atom.orbitRadius;
    const gy = y + Math.sin(atom.orbitAngle + Math.PI) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,212,255,0.4)";
    ctx.fill();

    // Decay countdown arc — color-shifting
    const maxDur = params.rydbergDuration;
    const fraction = Math.max(0, atom.stateTimer / maxDur);
    const hue = 180 * fraction; // 180=cyan, 60=yellow, 0=red
    ctx.beginPath();
    ctx.arc(x, y, 36, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

  } else if (state === "entangled") {
    // Outer glow
    const grad3 = ctx.createRadialGradient(x, y, 0, x, y, 70);
    grad3.addColorStop(0, `rgba(255,51,102,${0.1 * params.glowIntensity})`);
    grad3.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fillStyle = grad3;
    ctx.fill();

    // Mid glow
    const grad2 = ctx.createRadialGradient(x, y, 0, x, y, 40);
    grad2.addColorStop(0, `rgba(255,51,102,${0.4 * params.glowIntensity * pulse})`);
    grad2.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = grad2;
    ctx.fill();

    // Core glow
    const grad1 = ctx.createRadialGradient(x, y, 0, x, y, 22);
    grad1.addColorStop(0, `rgba(255,51,102,${0.8 * params.glowIntensity * pulse})`);
    grad1.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = grad1;
    ctx.fill();

    // Pulsing rings — faster
    const ringR1 = 28 + Math.sin(t * 0.012) * 6;
    ctx.beginPath();
    ctx.arc(x, y, ringR1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,51,102,${0.7 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer red ring
    ctx.beginPath();
    ctx.arc(x, y, 55, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,51,102,${0.3 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nucleus
    ctx.beginPath();
    ctx.arc(x, y, 10 * scale, 0, Math.PI * 2);
    ctx.fillStyle = RED;
    ctx.fill();

    // Orbital electron
    atom.orbitAngle += 0.015;
    const ex = x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
    const ey = y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = RED;
    ctx.fill();

    // Decay ring
    const maxDur = params.entangleDuration;
    const fraction = Math.max(0, atom.stateTimer / maxDur);
    ctx.beginPath();
    ctx.arc(x, y, 36, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  // User gold ring
  if (atom.isUser) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = atom.isUser ? "rgba(255,215,0,0.7)" : "rgba(232,244,248,0.6)";
  ctx.font = "9px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(atom.label, x, y + 55);

  ctx.restore();
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  atom: Atom,
  style: 'laser' | 'dot',
  t: number
) {
  const { x, y } = atom;
  ctx.save();

  if (style === 'dot') {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,51,102,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Slowly rotating crosshair
  const angle = t * 0.0008; // ~8s full rotation
  ctx.translate(x, y);
  ctx.rotate(angle);

  const gap = 14;
  const len = 35;
  ctx.strokeStyle = "rgba(255,51,102,0.7)";
  ctx.lineWidth = 1;

  // 4 lines
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * i);
    ctx.beginPath();
    ctx.moveTo(gap, 0);
    ctx.lineTo(gap + len, 0);
    ctx.stroke();

    // Tick at end
    ctx.beginPath();
    ctx.moveTo(gap + len, -4);
    ctx.lineTo(gap + len, 4);
    ctx.stroke();
    ctx.restore();
  }

  // Corner brackets at 45° offsets
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * i + Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(gap + 5, -3);
    ctx.lineTo(gap + 5, 0);
    ctx.lineTo(gap + 5 + 6, 0);
    ctx.strokeStyle = "rgba(255,51,102,0.4)";
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function drawExcitationFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number // 0→1
) {
  if (progress >= 1) return;
  const radius = 60 * progress;
  const alpha = 0.8 * (1 - progress * progress);
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
  grad.addColorStop(0.5, `rgba(0,212,255,${alpha * 0.5})`);
  grad.addColorStop(1, "transparent");
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

export function drawEntangleFlash(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number
) {
  if (progress >= 1) return;
  const alpha = 0.12 * (1 - progress);
  ctx.save();
  ctx.fillStyle = `rgba(255,51,102,${alpha})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
