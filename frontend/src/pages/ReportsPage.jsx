import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/api/reports/executive").then((res) => setSummary(res.data));
  }, []);

  async function download(format) {
    const response = await api.get(`/api/reports/export/${format}`, { responseType: "blob" });
    const blob = new Blob([response.data], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `networklab-report.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!summary) return <p>Loading report preview...</p>;

  return (
    <div className="space-y-4">
      <section className="glass rounded-xl border border-neon/30 p-4">
        <h2 className="font-orbitron text-neon">Executive Summary</h2>
        <p className="mt-2 text-sm text-slate-300">Risk Level: <span className="text-neon">{summary.riskLevel}</span></p>
        <p className="mt-2 text-sm text-slate-400">Generated: {new Date(summary.generatedAt).toLocaleString()}</p>
      </section>

      <section className="glass rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">Scan Overview</h3>
        {summary.scanOverview ? (
          <div className="mt-2 space-y-1 text-sm">
            <p>Target: {summary.scanOverview.target}</p>
            <p>Hosts Discovered: {summary.scanOverview.hostsDiscovered}</p>
            <p>Vulnerable Hosts: {summary.scanOverview.vulnerableHosts}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No scans available yet.</p>
        )}
      </section>

      <section className="glass rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">Recommendations</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {summary.recommendations.map((rec) => (
            <li key={rec}>- {rec}</li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">Export Report</h3>
        <div className="mt-3 grid gap-2 sm:flex sm:gap-2">
          <button className="btn-primary w-full sm:w-auto" onClick={() => download("json")}>Download JSON</button>
          <button className="btn-primary w-full sm:w-auto" onClick={() => download("csv")}>Download CSV</button>
        </div>
      </section>
    </div>
  );
}
