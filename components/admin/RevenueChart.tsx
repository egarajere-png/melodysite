"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RevenueChart({ data }: { data: { month: string; revenue: number; profit: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,7,11,0.08)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#09070B99" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#09070B99" }} axisLine={false} tickLine={false} width={70} />
        <Tooltip
          formatter={(value) => `KES ${Number(value).toLocaleString()}`}
          contentStyle={{ border: "1px solid rgba(9,7,11,0.1)", borderRadius: 0, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Revenue" fill="#3B1D4F" radius={[2, 2, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill="#C6A15B" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
