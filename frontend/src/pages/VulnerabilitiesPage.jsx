import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import SeverityBadge, { cvssToSeverity } from "../components/SeverityBadge";

export default function VulnerabilitiesPage() {
  const [items, setItems] = useState([]);
  const [severity, setSeverity] = useState("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api
      .get("/api/vulnerabilities", { params: { severity, q } })
      .then((res) => setItems(res.data));
  }, [severity, q]);

  const cvssTooltip = useMemo(
    () => "CVSS Base Score estimates impact and exploitability. 9.0-10 Critical, 7.0-8.9 High, 4.0-6.9 Medium, 0.1-3.9 Low.",
    []
  );

  return (
    <div className="dense-view space-y-4">
      <section className="glass rounded-xl border border-neon/30 p-4">
        <h2 className="font-orbitron text-neon">🛡️ Vulnerability Assessment</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-[220px,1fr]">
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input className="input" placeholder="Search CVE, title, or description" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="glass rounded-xl border border-neon/30 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h3 className="font-orbitron text-neon">{item.id}</h3>
                <p className="mt-1 text-sm text-slate-300">{item.title}</p>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <span className="rounded border border-slate-700 px-2 py-1 text-xs" title={cvssTooltip}>
                  CVSS {item.cvss}
                </span>
                <SeverityBadge severity={item.severity} />
                <button className="btn-primary text-sm" onClick={() => setExpanded((v) => (v === item.id ? null : item.id))}>
                  {expanded === item.id ? "Hide" : "View Details"}
                </button>
              </div>
            </div>

            {expanded === item.id ? (
              <div className="mt-4 space-y-3 rounded border border-slate-700 bg-black/40 p-4 text-sm">
                {/* Summary Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase text-neon/70 font-semibold">CVSS Score</p>
                    <p className="mt-1 text-lg font-mono text-neon">{item.cvss}</p>
                    <p className="text-xs text-slate-400">{cvssToSeverity(item.cvss)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neon/70 font-semibold">Severity</p>
                    <p className="mt-1">
                      <SeverityBadge severity={item.severity} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neon/70 font-semibold">Attack Vector</p>
                    <p className="mt-1 text-slate-300 text-xs">{item.attackVector || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neon/70 font-semibold">Affected Service</p>
                    <p className="mt-1 text-slate-300 text-xs">{item.affectedService || "N/A"}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded border border-slate-700 bg-black/30 p-3">
                    <p className="text-xs uppercase text-neon/70 font-semibold">Host</p>
                    <p className="mt-1 font-mono text-neon text-sm">{item.host || "N/A"}</p>
                  </div>
                  <div className="rounded border border-slate-700 bg-black/30 p-3">
                    <p className="text-xs uppercase text-neon/70 font-semibold">Port</p>
                    <p className="mt-1 font-mono text-neon text-sm">{item.port || "N/A"}</p>
                  </div>
                  <div className="rounded border border-slate-700 bg-black/30 p-3">
                    <p className="text-xs uppercase text-neon/70 font-semibold">Service</p>
                    <p className="mt-1 font-mono text-neon text-sm">{item.service || "N/A"}</p>
                  </div>
                </div>

                {/* Affected Software */}
                <div className="rounded border border-slate-600 bg-black/20 p-3">
                  <p className="text-xs uppercase text-neon/70 font-semibold mb-2">Affected Software</p>
                  <p className="text-slate-300 text-sm">{item.affectedSoftware || "N/A"}</p>
                </div>

                {/* Remediation */}
                <div>
                  <p className="text-xs uppercase text-neon/70 font-semibold mb-2">Remediation Steps</p>
                  <ul className="space-y-1 text-slate-300">
                    {(item.remediation?.steps || []).map((step, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-neon/60 flex-shrink-0">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Configuration & Command */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.remediation?.config && (
                    <div>
                      <p className="text-xs uppercase text-neon/70 font-semibold mb-2">Configuration</p>
                      <p className="font-mono text-xs bg-black/60 p-2 rounded border border-slate-700 text-slate-300 break-all">
                        {item.remediation.config}
                      </p>
                    </div>
                  )}
                  {item.remediation?.command && (
                    <div>
                      <p className="text-xs uppercase text-neon/70 font-semibold mb-2">Command</p>
                      <p className="font-mono text-xs bg-black/60 p-2 rounded border border-slate-700 text-slate-300 break-all">
                        {item.remediation.command}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
