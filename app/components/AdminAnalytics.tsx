"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0015]/90 backdrop-blur-xl p-4 shadow-2xl">
      <p className="text-white/50 text-xs uppercase tracking-widest mb-3">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60 text-xs capitalize">{p.dataKey}:</span>
          <span className="text-white font-black text-sm">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminAnalytics({ data }: { data: any[] }) {
  const lines = [
    { key: "users", color: "#a78bfa", label: "Users" },
    { key: "projects", color: "#22d3ee", label: "Projects" },
    { key: "requests", color: "#fbbf24", label: "Requests" },
  ];

  const totals = lines.map((l) => ({
    ...l,
    total: data.reduce((s, d) => s + (d[l.key] || 0), 0),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.3), transparent)" }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-violet-400/70 text-xs uppercase tracking-[0.3em] font-semibold mb-1">Platform Overview</p>
          <h2 className="text-2xl font-black text-white tracking-tight">Analytics</h2>
        </div>

        {/* Totals */}
        <div className="flex items-center gap-4">
          {totals.map((t) => (
            <div key={t.key} className="text-right">
              <p className="text-xl font-black" style={{ color: t.color }}>{t.total}</p>
              <p className="text-white/30 text-xs">{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        {lines.map((l) => (
          <div key={l.key} className="flex items-center gap-2">
            <div className="w-8 h-[2px] rounded-full" style={{ background: l.color }} />
            <span className="text-white/40 text-xs font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                strokeWidth={2.5}
                dot={{ fill: l.color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: l.color, stroke: "rgba(0,0,0,0.5)", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}