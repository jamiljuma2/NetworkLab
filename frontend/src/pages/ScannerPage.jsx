import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";
import TerminalOutput from "../components/TerminalOutput";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";

export default function ScannerPage() {
  // ===== STATE =====
  const { user } = useAuth();
  const [target, setTarget] = useState("192.168.1.0/24");
  const [scanType, setScanType] = useState("quick");
  const [scanning, setScanning] = useState(false);
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentScan, setCurrentScan] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [hosts, setHosts] = useState([]);

  const events = useSocket();

  // ===== INITIALIZATION =====
  useEffect(() => {
    // Load scan history
    api
      .get("/api/scans")
      .then((res) => setHistory(res.data || []))
      .catch(() => {});
  }, []);

  // ===== WEBSOCKET EVENTS =====
  useEffect(() => {
    // Handle scan:started
    const startedEvent = events.find((e) => e.name === "scan:started");
    if (startedEvent && startedEvent.payload) {
      const { scanId } = startedEvent.payload;
      setCurrentScan({ id: scanId });
      setScanning(true);
      setLines([`[*] Scan started on ${startedEvent.payload.target}`]);
      setProgress(5);
      setError("");
    }

    // Handle scan:progress (real output streaming)
    const progressEvent = events.find(
      (e) => e.name === "scan:progress" && e.payload?.scanId === currentScan?.id
    );
    if (progressEvent && progressEvent.payload) {
      const { latestLog, progress: newProgress, hosts: hostData } = progressEvent.payload;

      // Add latest log line
      if (latestLog) {
        setLines((prev) => [...prev, latestLog]);
      }

      // Update progress
      if (newProgress) {
        setProgress(newProgress);
      }

      // Update hosts if provided
      if (hostData) {
        setHosts((prev) => {
          const updated = [...prev];
          const existing = updated.find((h) => h.ip === hostData.ip);
          if (existing) {
            Object.assign(existing, hostData);
          } else {
            updated.push(hostData);
          }
          return updated;
        });
      }
    }

    // Handle scan:completed (final results)
    const completedEvent = events.find(
      (e) => e.name === "scan:completed" && e.payload?.scanId === currentScan?.id
    );
    if (completedEvent && completedEvent.payload) {
      const { hosts: finalHosts = [], logs: finalLogs = [] } = completedEvent.payload;

      // Update all final logs
      if (finalLogs.length > 0) {
        setLines(finalLogs);
      }

      // Update all hosts
      if (finalHosts.length > 0) {
        setHosts(finalHosts);
      }

      setProgress(100);
      setScanning(false);

      // Add to history
      setHistory((prev) => [
        {
          id: currentScan.id,
          target,
          scanType,
          status: completedEvent.payload.status || "completed",
          hostsFound: finalHosts.length,
          completedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    // Handle scan:error
    const errorEvent = events.find(
      (e) => e.name === "scan:error" && e.payload?.scanId === currentScan?.id
    );
    if (errorEvent && errorEvent.payload) {
      setError(`Scan failed: ${errorEvent.payload.error}`);
      setScanning(false);
      setProgress(0);
    }
  }, [events, currentScan?.id, target, scanType]);

  // ===== HANDLERS =====
  async function startScan() {
    if (!target.trim()) {
      setError("Please enter a target (e.g., 192.168.1.0/24 or localhost)");
      return;
    }

    // Reset state
    setLines([]);
    setProgress(0);
    setHosts([]);
    setError("");

    try {
      // Check if target looks like public IP (basic check)
      const isPublicLike = !target.match(
        /^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|.*\.local|.*\.internal)/i
      );

      // Require consent for production targets
      if (isPublicLike && !consentGiven) {
        setShowConsentDialog(true);
        return;
      }

      const { data } = await api.post("/api/scans/start", {
        target,
        scanType,
        consent: consentGiven,
      });

      setCurrentScan(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start scan");
      setScanning(false);
    }
  }

  async function stopCurrentScan() {
    if (!currentScan?.id) return;

    try {
      await api.post(`/api/scans/${currentScan.id}/stop`);
      setLines((prev) => [...prev, "[!] Scan aborted by user"]);
      setScanning(false);
    } catch (err) {
      setError("Unable to stop scan");
    }
  }

  const hostRows = useMemo(() => hosts || [], [hosts]);

  // ===== RENDER =====
  return (
    <div className="dense-view space-y-4">
      {/* CONSENT DIALOG */}
      {showConsentDialog && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass max-w-md rounded-xl border border-neon/30 p-6"
          >
            <h3 className="font-orbitron text-lg text-neon">Production Target Warning</h3>
            <p className="mt-3 text-sm text-slate-300">
              This target appears to be a public or production system. You must have explicit permission to scan it.
            </p>
            <p className="mt-2 text-xs text-red-300 font-semibold">
              By proceeding, you confirm that you own this system or have explicit written permission to scan it.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowConsentDialog(false);
                  setConsentGiven(false);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConsentGiven(true);
                  setShowConsentDialog(false);
                  // Retry scan with consent
                  setTimeout(() => {
                    api
                      .post("/api/scans/start", {
                        target,
                        scanType,
                        consent: true,
                      })
                      .then(({ data }) => setCurrentScan(data))
                      .catch((err) =>
                        setError(
                          err.response?.data?.message || "Scan failed"
                        )
                      );
                  }, 100);
                }}
                className="btn-primary flex-1"
              >
                I Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* SCANNER CONTROL */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-neon/30 p-4"
      >
        <h2 className="font-orbitron text-neon">Real Network Scanner</h2>
        <p className="mt-1 text-xs text-slate-400">
          Real Nmap execution with safe production mode • {user?.role || "Unknown"} role
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr,140px,120px,100px]">
          <input
            className="input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={scanning}
            placeholder="e.g. 192.168.1.0/24, localhost, or scan.local"
          />
          <select
            className="input"
            value={scanType}
            onChange={(e) => setScanType(e.target.value)}
            disabled={scanning}
          >
            <option value="quick">Quick (host discovery)</option>
            <option value="full">Full (ports + OS detection)</option>
          </select>

          {!scanning ? (
            <button onClick={startScan} className="btn-primary col-span-2 sm:col-span-1">
              Start Scan
            </button>
          ) : (
            <button onClick={stopCurrentScan} className="btn-danger col-span-2 sm:col-span-1">
              Stop Scan
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </motion.section>

      {/* PROGRESS BAR */}
      {scanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl border border-neon/30 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Scan Progress</span>
            <span className="text-sm font-mono text-neon">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-neon to-cyan-400"
            />
          </div>
        </motion.div>
      )}

      {/* TERMINAL OUTPUT */}
      {lines.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass dense-list rounded-xl border border-neon/30 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-orbitron text-neon">Terminal Stream</h3>
            <p className="text-xs text-slate-400">{lines.length} output lines</p>
          </div>
          <TerminalOutput lines={lines} />
        </motion.section>
      )}

      {/* DISCOVERED HOSTS */}
      {hostRows.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="font-orbitron text-neon px-4">Discovered Hosts ({hostRows.length})</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {hostRows.map((host, idx) => (
              <motion.article
                key={host.ip}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-xl border border-neon/30 p-4 hover:border-neon/60 transition-colors"
              >
                <p className="font-mono text-neon font-semibold">{host.ip}</p>
                {host.hostname && <p className="mt-1 text-xs text-slate-400">{host.hostname}</p>}
                {host.os && <p className="mt-1 text-sm text-slate-300">OS: {host.os.split("|")[0]}</p>}

                {host.ports && host.ports.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-400 font-mono">
                      {host.ports.map((p) => `${p.port}/${p.service}`).join(", ")}
                    </p>
                  </div>
                )}

                {host.vulnerable && (
                  <p className="mt-2 text-xs text-red-300 font-semibold">⚠️ Potentially vulnerable</p>
                )}
              </motion.article>
            ))}
          </div>
        </motion.section>
      )}

      {/* SCAN HISTORY */}
      {history.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass dense-list rounded-xl border border-neon/30 p-4"
        >
          <h3 className="font-orbitron text-neon">Scan History</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {history.slice(0, 8).map((scan) => (
              <li
                key={scan.id}
                className="flex items-center justify-between rounded border border-slate-700 p-2 hover:border-neon/30 transition-colors"
              >
                <div className="flex-1 overflow-hidden">
                  <p className="break-all font-mono text-slate-300">
                    {scan.target} ({scan.scanType})
                  </p>
                </div>
                <span className="ml-2 whitespace-nowrap text-neon/80">{scan.hostsFound || 0} hosts</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </div>
  );
}
