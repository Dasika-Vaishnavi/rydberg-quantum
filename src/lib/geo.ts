export function latLonToXY(
  lat: number,
  lon: number,
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  const padX = canvasW * 0.08;
  const padY = canvasH * 0.12;
  const w = canvasW - padX * 2;
  const h = canvasH - padY * 2;
  return {
    x: padX + ((lon + 180) / 360) * w,
    y: padY + ((90 - lat) / 180) * h,
  };
}

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pixelDistance(
  x1: number, y1: number,
  x2: number, y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
