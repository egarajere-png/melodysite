"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CategoryChart({ data }: { data: { category: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,7,11,0.08)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#09070B99" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12, fill: "#09070B99" }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          formatter={(value) => `KES ${Number(value).toLocaleString()}`}
          contentStyle={{ border: "1px solid rgba(9,7,11,0.1)", borderRadius: 0, fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#241338" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
