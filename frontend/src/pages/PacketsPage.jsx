import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";
import { useSocket } from "../hooks/useSocket";

export default function PacketsPage() {
  // ===== STATE =====
  const [rows, setRows] = useState([]);
  const [protocol, setProtocol] = useState("all");
  const [q, setQ] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [packetCount, setPacketCount] = useState(0);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [error, setError] = useState("");

  const events = useSocket();

  // ===== CHECK CAPTURE STATUS ON MOUNT =====
  useEffect(() => {
    api
      .get("/api/packets/status")
      .then((res) => {
        setCapturing(res.data.active);
        setPacketCount(res.data.packetCount);
        setSuspiciousCount(res.data.suspiciousCount);
      })
      .catch(() => {});
  }, []);

  // ===== LOAD INITIAL PACKETS =====
  useEffect(() => {
    const source = capturing ? "live" : "static";
    api
      .get("/api/packets", { params: { protocol, q, source } })
      .then((res) => setRows(res.data || []))
      .catch(() => {});
  }, [protocol, q, capturing]);

  // ===== LISTEN FOR REAL-TIME PACKET EVENTS =====
  useEffect(() => {
    const packetEvent = events.find((e) => e.name === "packet:captured");
    if (packetEvent && packetEvent.payload) {
      const { packet, totalCount, isSuspicious } = packetEvent.payload;

      // Add packet to rows (keep latest at top)
      setRows((prev) => [packet, ...prev].slice(0, 500));

      // Update counts
      setPacketCount(totalCount);
      if (isSuspicious) {
        setSuspiciousCount((prev) => prev + 1);
      }
    }
  }, [events]);

  // ===== START CAPTURE =====
  const startCapture = async () => {
    setError("");
    try {
      await api.post("/api/packets/capture/start");
      setCapturing(true);
      setPacketCount(0);
      setSuspiciousCount(0);
      setRows([]);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to start capture";
      if (err.response?.status === 400 && /already active/i.test(message)) {
        setCapturing(true);
        setError("");
        return;
      }
      setError(message);
    }
  };

  // ===== STOP CAPTURE =====
  const stopCapture = async () => {
    setError("");
    try {
      const result = await api.post("/api/packets/capture/stop");
      setCapturing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to stop capture");
    }
  };

  // ===== EXPORT CAPTURE =====
  const exportCapture = async () => {
    setError("");
    setExportNotice("");
    setIsExporting(true);
    try {
      const response = await api.get("/api/packets/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `packets-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExportNotice("Export started. Your JSON file has been downloaded.");
      setTimeout(() => setExportNotice(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dense-view space-y-4">
      {/* PACKET CAPTURE CONTROL */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-neon/30 p-4"
      >
        <h2 className="font-orbitron text-neon">Real-Time Packet Analysis</h2>
        <p className="mt-1 text-xs text-slate-400">
          Live network packet capture with Wireshark-style filtering
        </p>

        {/* CONTROL BUTTONS */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!capturing ? (
            <button onClick={startCapture} className="btn-primary">
              ▶ Start Capture
            </button>
          ) : (
            <button onClick={stopCapture} className="btn-danger">
              ⏹ Stop Capture
            </button>
          )}
          <button
            onClick={exportCapture}
            className="btn-secondary"
            disabled={packetCount === 0 || isExporting}
          >
            {isExporting ? "Exporting..." : "📥 Export as JSON"}
          </button>
        </div>

        {/* STATUS DISPLAY */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-neon/30 p-3 text-center">
            <p className="text-2xl font-bold text-neon">{packetCount}</p>
            <p className="text-xs text-slate-400">Total Packets</p>
            {capturing && (
              <div className="mt-2 flex justify-center">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-neon"
                />
              </div>
            )}
          </div>
          <div className="rounded border border-red-500/30 p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{suspiciousCount}</p>
            <p className="text-xs text-slate-400">Suspicious</p>
          </div>
          <div className="rounded border border-neon/30 p-3 text-center">
            <p className="text-sm text-neon font-mono">
              {capturing ? "🟢 LIVE" : "🔴 IDLE"}
            </p>
            <p className="text-xs text-slate-400">Capture Status</p>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-red-300">⚠️ {error}</p>}
        {exportNotice && <p className="mt-2 text-xs text-emerald-300">✅ {exportNotice}</p>}
      </motion.section>

      {/* FILTERS */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-neon/30 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-[200px,1fr]">
          <select
            className="input"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            disabled={!capturing}
          >
            <option value="all">All protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="HTTP">HTTP</option>
            <option value="DNS">DNS</option>
          </select>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search source, destination, info..."
            disabled={!capturing}
          />
        </div>
      </motion.section>

      {/* PACKETS TABLE (DESKTOP) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass dense-table hidden overflow-auto rounded-xl border border-neon/30 p-2 md:block"
      >
        {rows.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {capturing ? "Waiting for packets..." : "Start capture to see packets"}
          </div>
        ) : (
          <table className="min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Source IP</th>
                <th className="p-2">Destination IP</th>
                <th className="p-2">Protocol</th>
                <th className="p-2">Length</th>
                <th className="p-2">Info</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${
                    row.suspicious ? "bg-red-950/40" : ""
                  } border-t border-slate-800 hover:bg-slate-800/30 transition-colors`}
                >
                  <td className="p-2 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2 font-mono text-cyan-400">{row.src}</td>
                  <td className="p-2 font-mono text-cyan-400">{row.dst}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        row.protocol === "TCP"
                          ? "bg-blue-900/40 text-blue-300"
                          : row.protocol === "UDP"
                          ? "bg-green-900/40 text-green-300"
                          : row.protocol === "DNS"
                          ? "bg-purple-900/40 text-purple-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {row.protocol}
                    </span>
                  </td>
                  <td className="p-2 text-slate-400">{row.length} bytes</td>
                  <td className="p-2 text-slate-300 max-w-xs truncate">
                    {row.suspicious && <span className="text-red-400">⚠️ </span>}
                    {row.info}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.section>

      {/* PACKETS LIST (MOBILE) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dense-list space-y-2 md:hidden"
      >
        {rows.length === 0 ? (
          <div className="rounded border border-slate-800 p-4 text-center text-xs text-slate-400">
            {capturing ? "Waiting for packets..." : "Start capture to see packets"}
          </div>
        ) : (
          rows.map((row, idx) => (
            <motion.article
              key={row.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`glass rounded-xl border border-neon/30 p-3 text-xs ${
                row.suspicious ? "bg-red-950/25 border-red-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs ${
                    row.protocol === "TCP"
                      ? "bg-blue-900/40 text-blue-300"
                      : row.protocol === "UDP"
                      ? "bg-green-900/40 text-green-300"
                      : row.protocol === "DNS"
                      ? "bg-purple-900/40 text-purple-300"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {row.protocol}
                </span>
                <span className="text-slate-500">
                  {new Date(row.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="break-all font-mono text-neon">
                {row.src} → {row.dst}
              </p>
              <p className="mt-1 text-slate-400">
                {row.suspicious && <span className="text-red-400">⚠️ Suspicious: </span>}
                {row.info}
              </p>
              <p className="mt-1 text-slate-500">{row.length} bytes</p>
            </motion.article>
          ))
        )}
      </motion.section>
    </div>
  );
}
