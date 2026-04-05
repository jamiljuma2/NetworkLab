import { useEffect, useState } from "react";
import { api } from "../api/client";
import TopologyGraph from "../components/TopologyGraph";

export default function TopologyPage() {
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [selected, setSelected] = useState(null);
  const [scanId, setScanId] = useState("");

  async function loadTopology(selectedScanId) {
    const params = selectedScanId ? { scanId: selectedScanId } : {};
    const { data } = await api.get("/api/topology", { params });
    setTopology(data);

    if (!selectedScanId && data.scanId) {
      setScanId(data.scanId);
    }
  }

  useEffect(() => {
    loadTopology("");
  }, []);

  async function onSelectScan(e) {
    const nextScanId = e.target.value;
    setScanId(nextScanId);
    setSelected(null);
    await loadTopology(nextScanId);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <section className="glass rounded-xl border border-neon/30 p-4">
        <h2 className="font-orbitron text-neon">Interactive Network Topology</h2>
        <p className="mb-3 text-sm text-slate-400">Zoom, drag, and click nodes to inspect host state.</p>

        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr,2fr]">
          <label className="text-xs uppercase tracking-wider text-slate-400">Scan Network</label>
          <select className="input" value={scanId} onChange={onSelectScan}>
            {(topology.availableScans || []).map((scan) => (
              <option key={scan.id} value={scan.id}>
                {scan.target} | {scan.status} | hosts: {scan.hosts}
              </option>
            ))}
          </select>
        </div>

        {topology.target ? (
          <p className="mb-3 text-xs text-neon/80">Current topology target: {topology.target}</p>
        ) : null}

        <TopologyGraph data={topology} onSelectNode={setSelected} />
      </section>

      <section className="glass rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">Host Details</h3>
        {!selected ? <p className="mt-2 text-sm text-slate-500">Select a node to inspect details.</p> : null}
        {selected ? (
          <div className="mt-3 space-y-2 text-sm">
            <p><span className="text-slate-400">Label:</span> {selected.label}</p>
            <p><span className="text-slate-400">Type:</span> {selected.type}</p>
            <p><span className="text-slate-400">Vulnerable:</span> {selected.vulnerable ? "Yes" : "No"}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
