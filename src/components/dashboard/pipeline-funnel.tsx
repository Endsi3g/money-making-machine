"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PipelineData {
  name: string;
  value: number;
  color: string;
}

export function PipelineFunnel({ data }: { data: PipelineData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground font-mono">
        / NO_DATA
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={75}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value} leads`, ""]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion rate */}
      {data[0]?.value > 0 && data[data.length - 1]?.value > 0 && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono tracking-wider uppercase px-1">
          <span>{data[0].name}: {data[0].value}</span>
          <span>→</span>
          <span>{data[data.length - 1].name}: {data[data.length - 1].value} ({Math.round((data[data.length - 1].value / data[0].value) * 100)}%)</span>
        </div>
      )}
    </div>
  );
}
