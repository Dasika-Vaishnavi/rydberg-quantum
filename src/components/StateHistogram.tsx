import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SimResult } from "@/lib/quantum";

interface Props {
  result: SimResult | null;
}

export default function StateHistogram({ result }: Props) {
  const data = result?.probabilities ?? [];
  const chartData = data.map(d => ({
    label: `|${d.label}⟩`,
    prob: +(d.probability * 100).toFixed(2),
  }));

  return (
    <div className="quantum-card rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">
          Measurement Probabilities
        </span>
        {result?.expectationValue !== undefined && (
          <span className="text-xs font-mono text-quantum">
            ⟨Z⊗Z⟩ = {result.expectationValue.toFixed(4)}
          </span>
        )}
      </div>
      <div className="flex-1 p-4" style={{ minHeight: 200 }}>
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">
            Run simulation to see state probabilities
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "#374151" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "JetBrains Mono",
                  color: "#f8fafc",
                }}
                formatter={(v: number) => [`${v}%`, "Prob"]}
              />
              <Bar dataKey="prob" radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(82, 85%, ${52 - i * 2}%)`}
                    opacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
