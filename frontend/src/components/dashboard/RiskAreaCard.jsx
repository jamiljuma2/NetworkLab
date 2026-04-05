import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function RiskAreaCard({ trend }) {
  return (
    <section className="glass dense-chart rounded-xl border border-neon/30 p-4">
      <h2 className="font-orbitron text-neon">Risk Area</h2>
      <div className="chart-body h-60">
        <ResponsiveContainer>
          <AreaChart data={trend}>
            <XAxis dataKey="slot" stroke="#8fa2b8" />
            <YAxis stroke="#8fa2b8" />
            <Tooltip />
            <Area type="monotone" dataKey="vulnerabilities" stroke="#ff4d6d" fill="#ff4d6d55" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
