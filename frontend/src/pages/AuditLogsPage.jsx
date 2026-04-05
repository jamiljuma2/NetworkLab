import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    eventType: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  async function loadLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.eventType) params.append("eventType", filters.eventType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const { data } = await api.get(`/api/admin/audit-logs?${params.toString()}`);
      setLogs(data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  const eventTypes = [
    "SCAN_INITIATED",
    "SCAN_COMPLETED",
    "SCAN_STOPPED",
    "PRODUCTION_ACCESS_ATTEMPT",
    "AUTHORIZATION_FAILURE",
    "RATE_LIMIT_VIOLATION",
    "VALIDATION_FAILURE",
    "VULNERABILITY_DETECTED",
  ];

  const severityColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "text-red-300";
      case "MEDIUM":
        return "text-yellow-300";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="dense-view space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-neon/30 p-4"
      >
        <h2 className="font-orbitron text-neon">Audit Logs</h2>
        <p className="mt-1 text-xs text-slate-400">
          Security events, scan operations, and access attempts
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select
            className="input text-xs"
            value={filters.eventType}
            onChange={(e) =>
              setFilters({ ...filters, eventType: e.target.value })
            }
          >
            <option value="">All Events</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            className="input text-xs"
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            placeholder="Start date"
          />

          <input
            className="input text-xs"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="End date"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </motion.section>

      {loading ? (
        <div className="glass rounded-xl border border-neon/30 p-8 text-center text-slate-400">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="glass rounded-xl border border-neon/30 p-8 text-center text-slate-400">
          No audit logs found
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {logs.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="glass rounded-lg border border-slate-700 p-3 hover:border-neon/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-neon">
                      {log.eventType}
                    </span>
                    {log.severity && (
                      <span className={`text-xs font-bold ${severityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    )}
                    {log.scanId && (
                      <span className="text-xs text-slate-400">
                        Scan: <span className="text-cyan-300">{log.scanId}</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-300">
                    {log.userId && <span>User: {log.userId} • </span>}
                    {log.userRole && <span>Role: {log.userRole} • </span>}
                    {log.target && <span>Target: {log.target}</span>}
                  </p>

                  {log.reason && (
                    <p className="mt-1 text-xs text-slate-400 italic">
                      "{log.reason}"
                    </p>
                  )}

                  {log.error && (
                    <p className="mt-1 text-xs text-red-300">
                      Error: {log.error}
                    </p>
                  )}

                  {(log.consentProvided !== undefined ||
                    log.allowed !== undefined ||
                    log.hostsFound !== undefined) && (
                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                      {log.consentProvided !== undefined && (
                        <p>
                          Consent:{" "}
                          <span
                            className={
                              log.consentProvided ? "text-green-300" : "text-red-300"
                            }
                          >
                            {log.consentProvided ? "Yes" : "No"}
                          </span>
                        </p>
                      )}
                      {log.allowed !== undefined && (
                        <p>
                          Allowed:{" "}
                          <span
                            className={
                              log.allowed ? "text-green-300" : "text-red-300"
                            }
                          >
                            {log.allowed ? "Yes" : "No"}
                          </span>
                        </p>
                      )}
                      {log.hostsFound !== undefined && (
                        <p>Hosts Found: <span className="text-cyan-300">{log.hostsFound}</span></p>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
