import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ScanHostTrendCard({ trend }) {
  return (
    <section className="glass dense-chart rounded-xl border border-neon/30 p-4 lg:col-span-2">
      <h2 className="font-orbitron text-neon">Scan Host Trend</h2>
      <div className="chart-body h-64">
        <ResponsiveContainer>
          <BarChart data={trend}>
            <XAxis dataKey="slot" stroke="#8fa2b8" />
            <YAxis stroke="#8fa2b8" />
            <Tooltip />
            <Bar dataKey="hosts" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
