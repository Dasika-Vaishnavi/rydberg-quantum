import type { Atom, GameParams } from "./types";
import { pixelDistance } from "./geo";

export function createAtom(
  id: string,
  x: number,
  y: number,
  lat: number,
  lon: number,
  label: string,
  isUser: boolean,
  isGhost: boolean = false
): Atom {
  return {
    id,
    x,
    y,
    lat,
    lon,
    state: "ground",
    stateTimer: 0,
    isUser,
    isGhost,
    label,
    entangledWith: null,
    orbitAngle: Math.random() * Math.PI * 2,
    orbitRadius: 12,
    targetOrbitRadius: 12,
  };
}

export function exciteAtom(atom: Atom, params: GameParams): Atom {
  if (atom.state !== "ground") return atom;
  return {
    ...atom,
    state: "rydberg",
    stateTimer: params.rydbergDuration,
    targetOrbitRadius: 50,
  };
}

export function checkEntanglement(
  atoms: Atom[],
  params: GameParams
): Atom[] {
  const updated = atoms.map(a => ({ ...a }));

  for (let i = 0; i < updated.length; i++) {
    for (let j = i + 1; j < updated.length; j++) {
      const a = updated[i];
      const b = updated[j];
      if (
        a.state === "rydberg" &&
        b.state === "rydberg" &&
        pixelDistance(a.x, a.y, b.x, b.y) < params.orbitRadius * 2
      ) {
        updated[i] = {
          ...a,
          state: "entangled",
          stateTimer: params.entangleDuration,
          entangledWith: b.id,
        };
        updated[j] = {
          ...b,
          state: "entangled",
          stateTimer: params.entangleDuration,
          entangledWith: a.id,
        };
      }
    }
  }
  return updated;
}

export function updateAtomTimers(atoms: Atom[], dt: number, params: GameParams): Atom[] {
  return atoms.map(atom => {
    if (atom.state === "ground") return atom;

    const newTimer = atom.stateTimer - dt * params.decaySpeed;
    if (newTimer <= 0) {
      return {
        ...atom,
        state: "ground" as const,
        stateTimer: 0,
        entangledWith: null,
        targetOrbitRadius: 12,
      };
    }
    return { ...atom, stateTimer: newTimer };
  });
}
