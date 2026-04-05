import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import TerminalOutput from "../components/TerminalOutput";
import { useSocket } from "../hooks/useSocket";

const SeverityDistributionCard = lazy(() => import("../components/dashboard/SeverityDistributionCard"));
const ScanHostTrendCard = lazy(() => import("../components/dashboard/ScanHostTrendCard"));
const RiskAreaCard = lazy(() => import("../components/dashboard/RiskAreaCard"));

function ChartFallback({ heightClass = "h-64" }) {
  return (
    <section className="glass dense-chart rounded-xl border border-neon/30 p-4">
      <h2 className="font-orbitron text-neon">Loading Chart...</h2>
      <div className={`${heightClass} mt-2 animate-pulse rounded border border-slate-700 bg-slate-900/50`} />
    </section>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const events = useSocket();

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/api/dashboard/overview");
      setOverview(data);
      setLoading(false);
    }
    load();
  }, []);

  const pieData = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview.vulnerabilitiesBySeverity).map(([name, value]) => ({ name, value }));
  }, [overview]);

  const scanLogs = useMemo(() => {
    return events
      .filter((e) => e.name.startsWith("scan:"))
      .slice(0, 20)
      .map((e) => `[${new Date(e.at).toLocaleTimeString()}] ${e.name} ${e.payload.scanId || ""}`);
  }, [events]);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="dense-view space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Scans" value={overview.totalScans} icon="🛰️" />
        <StatCard label="Active Scans" value={overview.activeScans} icon="📡" />
        <StatCard label="Critical CVEs" value={overview.vulnerabilitiesBySeverity.Critical} tone="danger" icon="☣️" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Suspense fallback={<ChartFallback />}>
          <SeverityDistributionCard pieData={pieData} />
        </Suspense>

        <Suspense fallback={<ChartFallback />}>
          <ScanHostTrendCard trend={overview.trend} />
        </Suspense>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartFallback heightClass="h-60" />}>
          <RiskAreaCard trend={overview.trend} />
        </Suspense>

        <section className="glass dense-list rounded-xl border border-neon/30 p-4">
          <h2 className="font-orbitron text-neon">📟 Live Activity Feed</h2>
          <TerminalOutput lines={scanLogs.length ? scanLogs : overview.feed.map((f) => `${f.type.toUpperCase()} ${f.message}`)} />
        </section>
      </div>
    </div>
  );
}
