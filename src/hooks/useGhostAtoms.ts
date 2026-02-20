import { useRef, useCallback } from "react";
import type { Atom, GameParams } from "@/lib/types";
import { GHOST_LOCATIONS } from "@/lib/types";
import { latLonToXY } from "@/lib/geo";
import { createAtom } from "@/lib/atoms";

interface GhostState {
  atoms: Atom[];
  homePositions: { x: number; y: number }[];
  nextExciteTime: number[];
  initialized: boolean;
}

export function useGhostAtoms() {
  const stateRef = useRef<GhostState>({
    atoms: [],
    homePositions: [],
    nextExciteTime: [],
    initialized: false,
  });

  const init = useCallback((canvasW: number, canvasH: number, excludeIndex?: number) => {
    const locations = GHOST_LOCATIONS.filter((_, i) => i !== excludeIndex).slice(0, 5);
    const atoms: Atom[] = [];
    const homes: { x: number; y: number }[] = [];
    const exciteTimes: number[] = [];

    locations.forEach((loc, i) => {
      const pos = latLonToXY(loc.lat, loc.lon, canvasW, canvasH);
      const atom = createAtom(
        `ghost-${i}`,
        pos.x,
        pos.y,
        loc.lat,
        loc.lon,
        loc.label,
        false,
        true
      );
      atoms.push(atom);
      homes.push({ x: pos.x, y: pos.y });
      exciteTimes.push(Date.now() + 3000 + Math.random() * 10000);
    });

    stateRef.current = {
      atoms,
      homePositions: homes,
      nextExciteTime: exciteTimes,
      initialized: true,
    };
  }, []);

  const update = useCallback((dt: number, params: GameParams, t: number): Atom[] => {
    const s = stateRef.current;
    if (!s.initialized) return [];

    const now = Date.now();
    s.atoms = s.atoms.map((atom, i) => {
      // Random walk around home
      const home = s.homePositions[i];
      const wanderX = Math.sin(t * 0.001 + i * 2.1) * 40 + Math.cos(t * 0.0007 + i * 3.7) * 20;
      const wanderY = Math.cos(t * 0.0012 + i * 1.3) * 30 + Math.sin(t * 0.0005 + i * 4.2) * 15;
      const targetX = home.x + wanderX;
      const targetY = home.y + wanderY;
      atom.x += (targetX - atom.x) * 0.02;
      atom.y += (targetY - atom.y) * 0.02;

      // State transitions
      if (atom.state === "ground" && now > s.nextExciteTime[i]) {
        atom.state = "rydberg";
        atom.stateTimer = params.rydbergDuration;
        atom.targetOrbitRadius = 50;
        s.nextExciteTime[i] = now + params.rydbergDuration + 3000 + Math.random() * 12000;
      }

      if (atom.state !== "ground") {
        atom.stateTimer -= dt * params.decaySpeed;
        if (atom.stateTimer <= 0) {
          atom.state = "ground";
          atom.stateTimer = 0;
          atom.entangledWith = null;
          atom.targetOrbitRadius = 12;
        }
      }

      return atom;
    });

    return s.atoms;
  }, []);

  const getAtoms = useCallback((): Atom[] => {
    return stateRef.current.atoms;
  }, []);

  const repositionAll = useCallback((canvasW: number, canvasH: number) => {
    const s = stateRef.current;
    if (!s.initialized) return;
    const locations = GHOST_LOCATIONS.slice(0, s.atoms.length);
    locations.forEach((loc, i) => {
      const pos = latLonToXY(loc.lat, loc.lon, canvasW, canvasH);
      s.homePositions[i] = { x: pos.x, y: pos.y };
    });
  }, []);

  return { init, update, getAtoms, repositionAll };
}
