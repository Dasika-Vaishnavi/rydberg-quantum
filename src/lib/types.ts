export interface Atom {
  id: string;
  x: number;
  y: number;
  lat: number;
  lon: number;
  state: 'ground' | 'rydberg' | 'entangled';
  stateTimer: number;
  isUser: boolean;
  isGhost: boolean;
  label: string;
  entangledWith: string | null;
  orbitAngle: number;
  orbitRadius: number;
  targetOrbitRadius: number;
}

export interface GameParams {
  rydbergDuration: number;
  entangleDuration: number;
  orbitRadius: number;
  blockadeRadius: number;
  connectionThreshold: number;
  glowIntensity: number;
  decaySpeed: number;
  ghostsEnabled: boolean;
  crosshairStyle: 'laser' | 'dot';
}

export const DEFAULT_PARAMS: GameParams = {
  rydbergDuration: 5000,
  entangleDuration: 5000,
  orbitRadius: 45,
  blockadeRadius: 80,
  connectionThreshold: 120,
  glowIntensity: 0.8,
  decaySpeed: 1.0,
  ghostsEnabled: true,
  crosshairStyle: 'laser',
};

export interface BroadcastMessage {
  type: 'atom-update' | 'atom-disconnect';
  id: string;
  x?: number;
  y?: number;
  state?: Atom['state'];
  label?: string;
  stateTimer?: number;
}

export const GHOST_LOCATIONS = [
  { lat: 40.7, lon: -74.0, label: "new york" },
  { lat: 51.5, lon: -0.1, label: "london" },
  { lat: 35.7, lon: 139.7, label: "tokyo" },
  { lat: -33.9, lon: 18.4, label: "cape town" },
  { lat: 19.4, lon: -99.1, label: "mexico city" },
  { lat: 28.6, lon: 77.2, label: "delhi" },
];
