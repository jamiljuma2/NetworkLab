import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = { Critical: "#ff4d6d", High: "#fb923c", Medium: "#facc15", Low: "#22d3ee" };

export default function SeverityDistributionCard({ pieData }) {
  return (
    <section className="glass dense-chart rounded-xl border border-neon/30 p-4 lg:col-span-1">
      <h2 className="font-orbitron text-neon">Severity Distribution</h2>
      <div className="chart-body h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
