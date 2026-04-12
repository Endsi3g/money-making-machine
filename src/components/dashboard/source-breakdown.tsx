"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SourceData {
  name: string;
  value: number;
}

const COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

export function SourceBreakdown({ data }: { data: SourceData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground font-mono">
        / NO_DATA
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={65}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value} leads`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-2.5">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs capitalize">{entry.name.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium">{entry.value}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {Math.round((entry.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
