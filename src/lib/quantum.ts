// Lightweight quantum simulation engine in TypeScript
// Simulates state vectors, gates, and measurements without PennyLane

export type Complex = [number, number]; // [real, imaginary]

export const complex = (r: number, i = 0): Complex => [r, i];
export const cmul = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];
export const cadd = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]];
export const cnorm2 = (a: Complex): number => a[0] * a[0] + a[1] * a[1];

const SQRT2_INV = 1 / Math.sqrt(2);

// Standard gates as 2x2 or 4x4 matrices
export const GATES = {
  H: [
    [complex(SQRT2_INV), complex(SQRT2_INV)],
    [complex(SQRT2_INV), complex(-SQRT2_INV)],
  ],
  X: [
    [complex(0), complex(1)],
    [complex(1), complex(0)],
  ],
  RY: (theta: number) => [
    [complex(Math.cos(theta / 2)), complex(-Math.sin(theta / 2))],
    [complex(Math.sin(theta / 2)), complex(Math.cos(theta / 2))],
  ],
  RX: (theta: number) => [
    [complex(Math.cos(theta / 2)), [0, -Math.sin(theta / 2)] as Complex],
    [[0, -Math.sin(theta / 2)] as Complex, complex(Math.cos(theta / 2))],
  ],
  RZ: (theta: number) => [
    [[Math.cos(theta / 2), -Math.sin(theta / 2)] as Complex, complex(0)],
    [complex(0), [Math.cos(theta / 2), Math.sin(theta / 2)] as Complex],
  ],
};

export function createStateVector(n: number): Complex[] {
  const size = 1 << n;
  const state: Complex[] = Array(size).fill(null).map(() => complex(0));
  state[0] = complex(1);
  return state;
}

export function applySingleGate(
  state: Complex[],
  gate: Complex[][],
  target: number,
  nQubits: number
): Complex[] {
  const size = 1 << nQubits;
  const newState: Complex[] = Array(size).fill(null).map(() => complex(0));

  for (let i = 0; i < size; i++) {
    const bit = (i >> (nQubits - 1 - target)) & 1;
    const partner = i ^ (1 << (nQubits - 1 - target));

    if (bit === 0) {
      newState[i] = cadd(newState[i], cmul(gate[0][0], state[i]));
      newState[i] = cadd(newState[i], cmul(gate[0][1], state[partner]));
      newState[partner] = cadd(newState[partner], cmul(gate[1][0], state[i]));
      newState[partner] = cadd(newState[partner], cmul(gate[1][1], state[partner]));
    }
  }
  return newState;
}

export function applyCNOT(
  state: Complex[],
  control: number,
  target: number,
  nQubits: number
): Complex[] {
  const size = 1 << nQubits;
  const newState: Complex[] = [...state.map(c => [...c] as Complex)];

  for (let i = 0; i < size; i++) {
    const controlBit = (i >> (nQubits - 1 - control)) & 1;
    if (controlBit === 1) {
      const partner = i ^ (1 << (nQubits - 1 - target));
      if (i < partner) {
        const tmp = newState[i];
        newState[i] = newState[partner];
        newState[partner] = tmp;
      }
    }
  }
  return newState;
}

export function applyCRZ(
  state: Complex[],
  control: number,
  target: number,
  angle: number,
  nQubits: number
): Complex[] {
  const size = 1 << nQubits;
  const newState: Complex[] = state.map(c => [...c] as Complex);
  const rz = GATES.RZ(angle);

  for (let i = 0; i < size; i++) {
    const controlBit = (i >> (nQubits - 1 - control)) & 1;
    if (controlBit === 1) {
      const targetBit = (i >> (nQubits - 1 - target)) & 1;
      const partner = i ^ (1 << (nQubits - 1 - target));
      if (targetBit === 0) {
        newState[i] = cadd(cmul(rz[0][0], state[i]), cmul(rz[0][1], state[partner]));
        newState[partner] = cadd(cmul(rz[1][0], state[i]), cmul(rz[1][1], state[partner]));
      }
    }
  }
  return newState;
}

export function getProbabilities(state: Complex[]): number[] {
  return state.map(c => cnorm2(c));
}

export function getLabels(nQubits: number): string[] {
  const size = 1 << nQubits;
  return Array.from({ length: size }, (_, i) =>
    i.toString(2).padStart(nQubits, "0")
  );
}

export interface SimResult {
  probabilities: { label: string; probability: number }[];
  entanglementPairs: [number, number][];
  expectationValue?: number;
  circuitGates: { gate: string; targets: number[] }[];
}

export function simulateRydbergBlockade(nQubits: number): SimResult {
  let state = createStateVector(nQubits);
  const gates: SimResult["circuitGates"] = [];

  // Hadamard on qubit 0
  state = applySingleGate(state, GATES.H, 0, nQubits);
  gates.push({ gate: "H", targets: [0] });

  // CNOT chain (blockade propagation)
  for (let i = 0; i < nQubits - 1; i++) {
    state = applyCNOT(state, i, i + 1, nQubits);
    gates.push({ gate: "CX", targets: [i, i + 1] });
  }

  const probs = getProbabilities(state);
  const labels = getLabels(nQubits);

  return {
    probabilities: labels
      .map((l, i) => ({ label: l, probability: probs[i] }))
      .filter(d => d.probability > 1e-6),
    entanglementPairs: Array.from({ length: nQubits - 1 }, (_, i) => [i, i + 1] as [number, number]),
    circuitGates: gates,
  };
}

export function simulateOpticalTweezer(nQubits: number, params: number[]): SimResult {
  let state = createStateVector(nQubits);
  const gates: SimResult["circuitGates"] = [];

  // RY rotations (laser pulses)
  for (let i = 0; i < nQubits; i++) {
    const angle = params[i] ?? Math.PI / 4;
    state = applySingleGate(state, GATES.RY(angle), i, nQubits);
    gates.push({ gate: `RY(${angle.toFixed(2)})`, targets: [i] });
  }

  // Distance-dependent CRZ
  for (let i = 0; i < nQubits - 1; i++) {
    const dist = 1.5;
    const angle = Math.PI / (dist + 0.1);
    state = applyCRZ(state, i, i + 1, angle, nQubits);
    gates.push({ gate: "CRZ", targets: [i, i + 1] });
  }

  const probs = getProbabilities(state);
  const labels = getLabels(nQubits);

  return {
    probabilities: labels.map((l, i) => ({ label: l, probability: probs[i] })),
    entanglementPairs: Array.from({ length: nQubits - 1 }, (_, i) => [i, i + 1] as [number, number]),
    circuitGates: gates,
  };
}

export function simulateVariational(nQubits: number, params: number[]): SimResult {
  let state = createStateVector(nQubits);
  const gates: SimResult["circuitGates"] = [];

  // RX encoding layer
  for (let i = 0; i < nQubits; i++) {
    const angle = params[i] ?? Math.random() * Math.PI;
    state = applySingleGate(state, GATES.RX(angle), i, nQubits);
    gates.push({ gate: `RX(${angle.toFixed(2)})`, targets: [i] });
  }

  // Entangling layer
  for (let i = 0; i < nQubits - 1; i++) {
    state = applyCNOT(state, i, i + 1, nQubits);
    gates.push({ gate: "CX", targets: [i, i + 1] });
  }

  // RY variational layer
  for (let i = 0; i < nQubits; i++) {
    const angle = params[i + nQubits] ?? Math.random() * Math.PI;
    state = applySingleGate(state, GATES.RY(angle), i, nQubits);
    gates.push({ gate: `RY(${angle.toFixed(2)})`, targets: [i] });
  }

  const probs = getProbabilities(state);
  const labels = getLabels(nQubits);

  // Compute expectation value ⟨Z₀⊗Z_{n-1}⟩
  let expectation = 0;
  for (let i = 0; i < probs.length; i++) {
    const firstBit = (i >> (nQubits - 1)) & 1;
    const lastBit = i & 1;
    const eigenvalue = (firstBit === 0 ? 1 : -1) * (lastBit === 0 ? 1 : -1);
    expectation += eigenvalue * probs[i];
  }

  const sorted = labels
    .map((l, i) => ({ label: l, probability: probs[i] }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8);

  return {
    probabilities: sorted,
    entanglementPairs: Array.from({ length: nQubits - 1 }, (_, i) => [i, i + 1] as [number, number]),
    expectationValue: expectation,
    circuitGates: gates,
  };
}
