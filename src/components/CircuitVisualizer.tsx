import type { SimResult } from "@/lib/quantum";

interface Props {
  nQubits: number;
  result: SimResult | null;
}

export default function CircuitVisualizer({ nQubits, result }: Props) {
  const gates = result?.circuitGates ?? [];

  // Group gates into columns
  const columns: { gate: string; targets: number[] }[][] = [];
  const occupied = new Set<string>();

  for (const g of gates) {
    const key = g.targets.join(",");
    let placed = false;
    for (let ci = 0; ci < columns.length; ci++) {
      const colOccupied = columns[ci].flatMap(gg => gg.targets);
      if (!g.targets.some(t => colOccupied.includes(t))) {
        columns[ci].push(g);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([g]);
  }

  const colWidth = 64;
  const rowHeight = 36;
  const leftPad = 48;
  const svgWidth = leftPad + columns.length * colWidth + 40;
  const svgHeight = nQubits * rowHeight + 20;

  return (
    <div className="quantum-card rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">Circuit Diagram</span>
      </div>
      <div className="p-3 overflow-x-auto">
        {gates.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-muted-foreground text-xs font-mono">
            Run to render circuit
          </div>
        ) : (
          <svg width={svgWidth} height={svgHeight} className="font-mono">
            {/* Wires */}
            {Array.from({ length: nQubits }).map((_, i) => (
              <g key={`wire-${i}`}>
                <line
                  x1={leftPad - 10}
                  x2={svgWidth - 10}
                  y1={10 + i * rowHeight + rowHeight / 2}
                  y2={10 + i * rowHeight + rowHeight / 2}
                  stroke="#374151"
                  strokeWidth={1}
                />
                <text
                  x={8}
                  y={10 + i * rowHeight + rowHeight / 2 + 4}
                  fill="#94a3b8"
                  fontSize={11}
                >
                  q{i}
                </text>
              </g>
            ))}
            {/* Gates */}
            {columns.map((col, ci) =>
              col.map((g, gi) => {
                const x = leftPad + ci * colWidth + colWidth / 2;
                const isTwoQubit = g.targets.length === 2;
                const label = g.gate.replace(/\(.*\)/, "");

                if (isTwoQubit) {
                  const y0 = 10 + g.targets[0] * rowHeight + rowHeight / 2;
                  const y1 = 10 + g.targets[1] * rowHeight + rowHeight / 2;
                  return (
                    <g key={`${ci}-${gi}`}>
                      <line x1={x} x2={x} y1={y0} y2={y1} stroke="#a3e635" strokeWidth={1.5} />
                      <circle cx={x} cy={y0} r={4} fill="#a3e635" />
                      <rect
                        x={x - 18}
                        y={y1 - 13}
                        width={36}
                        height={26}
                        rx={4}
                        fill="#1a2e05"
                        stroke="#a3e635"
                        strokeWidth={1}
                      />
                      <text x={x} y={y1 + 4} textAnchor="middle" fill="#a3e635" fontSize={10}>
                        {label}
                      </text>
                    </g>
                  );
                }

                const y = 10 + g.targets[0] * rowHeight + rowHeight / 2;
                return (
                  <g key={`${ci}-${gi}`}>
                    <rect
                      x={x - 18}
                      y={y - 13}
                      width={36}
                      height={26}
                      rx={4}
                      fill="#1a2e05"
                      stroke="#a3e635"
                      strokeWidth={1}
                    />
                    <text x={x} y={y + 4} textAnchor="middle" fill="#a3e635" fontSize={10}>
                      {label}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
