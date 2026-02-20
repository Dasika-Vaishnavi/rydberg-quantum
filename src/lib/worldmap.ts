// Simplified continent outlines as [lon, lat] coordinate arrays
// Highly simplified for performance — ~30-60 points per continent

export const CONTINENTS: { name: string; points: [number, number][] }[] = [
  {
    name: "North America",
    points: [
      [-130, 55], [-120, 60], [-100, 65], [-85, 70], [-70, 65],
      [-60, 50], [-65, 45], [-75, 35], [-80, 30], [-85, 25],
      [-90, 20], [-100, 18], [-105, 22], [-110, 30], [-120, 35],
      [-125, 45], [-130, 55],
    ],
  },
  {
    name: "South America",
    points: [
      [-80, 10], [-75, 5], [-60, 5], [-50, 0], [-45, -5],
      [-35, -10], [-40, -20], [-45, -25], [-50, -30],
      [-55, -35], [-60, -40], [-65, -50], [-70, -45],
      [-75, -35], [-75, -20], [-80, -5], [-80, 10],
    ],
  },
  {
    name: "Europe",
    points: [
      [-10, 40], [-5, 45], [0, 50], [5, 55], [10, 60],
      [20, 65], [30, 70], [35, 65], [30, 55], [25, 45],
      [20, 40], [10, 38], [0, 38], [-10, 40],
    ],
  },
  {
    name: "Africa",
    points: [
      [-15, 35], [-5, 35], [10, 33], [20, 30], [30, 30],
      [35, 25], [40, 15], [50, 10], [45, 0], [40, -5],
      [35, -15], [30, -25], [25, -33], [18, -35],
      [15, -30], [10, -20], [5, -5], [0, 5],
      [-5, 10], [-15, 15], [-18, 20], [-15, 30], [-15, 35],
    ],
  },
  {
    name: "Asia",
    points: [
      [30, 70], [40, 72], [60, 70], [80, 72], [100, 70],
      [120, 65], [135, 55], [140, 45], [130, 35],
      [120, 25], [110, 20], [100, 15], [95, 10],
      [80, 10], [70, 20], [60, 25], [50, 30],
      [40, 35], [30, 40], [25, 45], [30, 55], [30, 70],
    ],
  },
  {
    name: "Australia",
    points: [
      [115, -15], [125, -13], [135, -12], [145, -15],
      [150, -20], [153, -28], [148, -35], [140, -38],
      [130, -35], [120, -30], [115, -25], [113, -20],
      [115, -15],
    ],
  },
];

export function drawWorldMap(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  latLonToXY: (lat: number, lon: number, w: number, h: number) => { x: number; y: number }
) {
  ctx.save();
  for (const continent of CONTINENTS) {
    ctx.beginPath();
    for (let i = 0; i < continent.points.length; i++) {
      const [lon, lat] = continent.points[i];
      const { x, y } = latLonToXY(lat, lon, canvasW, canvasH);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}
