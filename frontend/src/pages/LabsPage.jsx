import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import TerminalOutput from "../components/TerminalOutput";

export default function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [expandedLabId, setExpandedLabId] = useState(null);
  const [labStates, setLabStates] = useState({});
  const [execInputs, setExecInputs] = useState({});
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [completedIds, setCompletedIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("networklab_completed_labs") || "[]");
    } catch {
      return [];
    }
  });
  const [lastLabId, setLastLabId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("networklab_last_lab_id");
  });

  useEffect(() => {
    api.get("/api/labs").then((res) => {
      setLabs(res.data);
      const initialStates = {};
      const initialInputs = {};
      res.data.forEach((lab) => {
        initialStates[lab.id] = {
          data: null,
          hintIndex: 0,
          hintShown: false,
          showSolution: false,
          launched: false,
          requestError: "",
        };
        initialInputs[lab.id] = {
          target: "http://localhost:3000",
          routePath: "/",
          httpMethod: "GET",
          notes: "",
        };
      });
      setLabStates(initialStates);
      setExecInputs(initialInputs);

      if (lastLabId && res.data.some((lab) => lab.id === lastLabId)) {
        setExpandedLabId(lastLabId);
        api.get(`/api/labs/${lastLabId}`).then(({ data }) => {
          setLabStates((prev) => ({
            ...prev,
            [lastLabId]: {
              ...(prev[lastLabId] || {
                data: null,
                hintIndex: 0,
                hintShown: false,
                showSolution: false,
                launched: false,
                requestError: "",
              }),
              data,
            },
          }));
        }).catch(() => {});
      }
    });
  }, [lastLabId]);

  useEffect(() => {
    loadExecutions();
  }, []);

  async function loadExecutions() {
    const { data } = await api.get("/api/labs/executions");
    setExecutions(data);
  }

  useEffect(() => {
    localStorage.setItem("networklab_completed_labs", JSON.stringify(completedIds));
  }, [completedIds]);

  useEffect(() => {
    if (lastLabId) {
      localStorage.setItem("networklab_last_lab_id", lastLabId);
    }
  }, [lastLabId]);

  const categories = useMemo(() => {
    return ["all", ...new Set(labs.map((lab) => lab.category).filter(Boolean))];
  }, [labs]);

  const filteredLabs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return labs
      .filter((lab) => (categoryFilter === "all" ? true : lab.category === categoryFilter))
      .filter((lab) => {
        if (!search) return true;
        return [lab.title, lab.category, lab.scenario, lab.icon]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [labs, query, categoryFilter]);

  async function toggleLab(id) {
    if (expandedLabId === id) {
      setExpandedLabId(null);
    } else {
      const currentState = labStates[id] || {
        data: null,
        hintIndex: 0,
        hintShown: false,
        showSolution: false,
        launched: false,
        requestError: "",
      };
      if (!currentState.data) {
        const { data } = await api.get(`/api/labs/${id}`);
        setLabStates((prev) => ({
          ...prev,
          [id]: { ...(prev[id] || currentState), data },
        }));
      }
      setExpandedLabId(id);
      setLastLabId(id);

      // Bring the expanded card near the top so details are visible immediately.
      requestAnimationFrame(() => {
        const card = document.getElementById(`lab-card-${id}`);
        if (!card) return;
        const top = card.getBoundingClientRect().top + window.scrollY - 92;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    }
  }

  function launchLab(id) {
    setLabStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], launched: true },
    }));
  }

  function nextHint(id) {
    setLabStates((prev) => {
      const state = prev[id];
      return {
        ...prev,
        [id]: {
          ...state,
          hintShown: true,
          hintIndex: Math.min(state.hintIndex + 1, state.data.hints.length - 1),
        },
      };
    });
  }

  function toggleSolution(id) {
    setLabStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], showSolution: !prev[id].showSolution },
    }));
  }

  function toggleCompleted(id) {
    setCompletedIds((prev) => (prev.includes(id) ? prev.filter((labId) => labId !== id) : [...prev, id]));
  }

  function updateExecInput(id, key, value) {
    setExecInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }

  async function requestExecution(id) {
    const input = execInputs[id] || {};
    setLabStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], requestError: "" },
    }));

    try {
      await api.post(`/api/labs/${id}/executions`, input);
      await loadExecutions();
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to request safe execution";
      setLabStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], requestError: msg },
      }));
    }
  }

  function latestExecutionFor(labId) {
    return executions.find((e) => e.labId === labId) || null;
  }

  function statusTone(status) {
    if (status === "completed") return "border-emerald-500/60 text-emerald-300";
    if (status === "pending_approval") return "border-amber-500/60 text-amber-300";
    if (status === "rejected") return "border-rose-500/60 text-rose-300";
    if (status === "running") return "border-cyan-500/60 text-cyan-300";
    return "border-slate-700 text-slate-300";
  }

  const isExpanded = (id) => expandedLabId === id;
  const getState = (id) => labStates[id];
  const completedCount = completedIds.filter((labId) => labs.some((lab) => lab.id === labId)).length;
  const hasLastLab = lastLabId && labs.some((lab) => lab.id === lastLabId);

  return (
    <div className="dense-view space-y-4">
      <section className="glass ui-smooth rounded-xl border border-neon/30 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-orbitron text-neon">Interactive Cyber Range</h2>
            <p className="mt-2 text-sm text-slate-400">Search, filter, and resume scenarios using real lab data.</p>
          </div>
          {hasLastLab ? (
            <button className="btn-primary ui-smooth w-full text-xs sm:w-auto lg:self-start" onClick={() => toggleLab(lastLabId)}>
              Resume last lab
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,220px] xl:grid-cols-[1fr,220px,220px]">
          <input
            className="input"
            placeholder="Search labs by title, category, or scenario"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All categories" : category}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2 text-[11px] uppercase tracking-wider text-slate-300 md:col-span-2 xl:col-span-1">
            <span className="rounded border border-slate-700 px-2 py-2 text-center">{labs.length} labs</span>
            <span className="rounded border border-slate-700 px-2 py-2 text-center">{completedCount} completed</span>
            <span className="rounded border border-slate-700 px-2 py-2 text-center">{labs.length - completedCount} pending</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {filteredLabs.length === 0 ? (
          labs.length === 0 ? (
          <p className="text-slate-400">Loading lab scenarios...</p>
          ) : (
            <p className="text-slate-400">No labs match your current search or category filter.</p>
          )
        ) : (
          filteredLabs.map((lab) => {
            const state = getState(lab.id);
            const expanded = isExpanded(lab.id);
            const selected = state?.data;
            const completed = completedIds.includes(lab.id);
            const latestExecution = latestExecutionFor(lab.id);

            return (
              <article
                key={lab.id}
                id={`lab-card-${lab.id}`}
                className={`glass ui-card-interactive rounded-xl border duration-300 ease-out ${
                  expanded
                    ? "border-neon/60 ring-2 ring-neon/20"
                    : "border-neon/30 hover:border-neon/50"
                } p-4`}
              >
                <button
                  onClick={() => toggleLab(lab.id)}
                  className="ui-smooth w-full text-left active:scale-[0.995]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-orbitron transition-colors ${
                        expanded ? "text-neon" : "text-slate-300 hover:text-neon"
                      }`}>
                        <span className="mr-2 inline-block text-[0.85em] align-[-0.08em] leading-none">
                          {lab.icon || "🧪"}
                        </span>
                        <span className="align-middle">{lab.title}</span>
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-neon/60">
                        {lab.category}
                      </p>
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                        {lab.scenario}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-slate-300 sm:text-[11px]">
                        <span className="rounded-full border border-slate-700 px-2 py-1">
                          {lab.hintsCount} hints
                        </span>
                        <span className="rounded-full border border-slate-700 px-2 py-1">
                          {lab.objectivesCount} objectives
                        </span>
                        <span className="rounded-full border border-slate-700 px-2 py-1">
                          {lab.hasTerminal ? "terminal" : "no terminal"}
                        </span>
                        <span className="rounded-full border border-slate-700 px-2 py-1">
                          {lab.hasSolution ? "solution" : "no solution"}
                        </span>
                        <span className={`rounded-full border px-2 py-1 ${completed ? "border-emerald-500/60 text-emerald-300" : "border-slate-700"}`}>
                          {completed ? "completed" : "not completed"}
                        </span>
                        <span className={`rounded-full border px-2 py-1 ${statusTone(latestExecution?.status)}`}>
                          {latestExecution ? latestExecution.status.replace("_", " ") : "no execution"}
                        </span>
                      </div>
                    </div>
                    <span className={`text-neon transition-transform ${expanded ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {expanded && selected && (
                  <div className="mt-4 space-y-3 border-t border-neon/20 pt-4">
                    <div>
                      <h4 className="font-orbitron text-neon text-sm uppercase tracking-wider">Purpose</h4>
                      <p className="mt-2 text-sm text-slate-300">{selected.scenario}</p>
                    </div>

                    <div>
                      <h4 className="font-orbitron text-neon text-sm uppercase tracking-wider">Objectives</h4>
                      {Array.isArray(selected.objectives) && selected.objectives.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-slate-300">
                          {selected.objectives.map((objective) => (
                            <li key={objective} className="flex items-start gap-2">
                              <span className="text-neon">▸</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">This lab focuses on scenario execution and terminal analysis rather than explicit objectives.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        className="btn-primary ui-smooth w-full text-xs sm:w-auto"
                        onClick={() => launchLab(lab.id)}
                      >
                        Launch
                      </button>
                      <button
                        className="btn-primary ui-smooth w-full text-xs sm:w-auto"
                        onClick={() => nextHint(lab.id)}
                      >
                        {state.hintShown ? "Next Hint" : "Show Hints"}
                      </button>
                      <button
                        className="btn-primary ui-smooth w-full text-xs sm:w-auto"
                        onClick={() => toggleCompleted(lab.id)}
                      >
                        {completed ? "Mark Incomplete" : "Mark Complete"}
                      </button>
                    </div>

                    <div className="rounded border border-neon/30 bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-wider text-neon/60">Safe Execution Request</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <input
                          className="input"
                          placeholder="Target (localhost/private/* .local)"
                          value={execInputs[lab.id]?.target || ""}
                          onChange={(e) => updateExecInput(lab.id, "target", e.target.value)}
                        />
                        <input
                          className="input"
                          placeholder="Route path"
                          value={execInputs[lab.id]?.routePath || ""}
                          onChange={(e) => updateExecInput(lab.id, "routePath", e.target.value)}
                        />
                        <select
                          className="input"
                          value={execInputs[lab.id]?.httpMethod || "GET"}
                          onChange={(e) => updateExecInput(lab.id, "httpMethod", e.target.value)}
                        >
                          <option>GET</option>
                          <option>POST</option>
                          <option>PUT</option>
                          <option>PATCH</option>
                          <option>DELETE</option>
                        </select>
                        <input
                          className="input"
                          placeholder="Optional notes"
                          value={execInputs[lab.id]?.notes || ""}
                          onChange={(e) => updateExecInput(lab.id, "notes", e.target.value)}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button className="btn-primary ui-smooth w-full text-xs sm:w-auto" onClick={() => requestExecution(lab.id)}>
                          Request Safe Execution
                        </button>
                        <button className="btn-primary ui-smooth w-full text-xs sm:w-auto" onClick={loadExecutions}>
                          Refresh Status
                        </button>
                      </div>
                      {state?.requestError ? (
                        <p className="mt-2 text-xs text-rose-300">{state.requestError}</p>
                      ) : null}
                    </div>

                    {latestExecution ? (
                      <div className="rounded border border-neon/30 bg-black/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-wider text-neon/60">Latest Execution</p>
                          <span className={`rounded-full border px-2 py-1 text-[11px] uppercase ${statusTone(latestExecution.status)}`}>
                            {latestExecution.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300">
                          {latestExecution.httpMethod} {latestExecution.routePath} on {latestExecution.target}
                        </p>
                        {Array.isArray(latestExecution.evidence) && latestExecution.evidence.length > 0 ? (
                          <div className="mt-3 rounded border border-slate-700 bg-black/40 p-2">
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-neon/60">Evidence</p>
                            <ul className="space-y-1 text-xs text-slate-300">
                              {latestExecution.evidence.map((line, idx) => (
                                <li key={`${latestExecution.id}-${idx}`}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {state.hintShown && (
                      <div className="rounded border border-neon/30 bg-black/30 p-3">
                        <p className="text-xs uppercase tracking-wider text-neon/60">Hint {state.hintIndex + 1}</p>
                        <p className="mt-1 text-sm text-slate-300">{selected.hints[state.hintIndex]}</p>
                      </div>
                    )}

                    {state.launched && (
                      <div className="space-y-3">
                        <div className="rounded border border-neon/30 bg-black/30 p-3">
                          <p className="mb-2 text-xs uppercase tracking-wider text-neon/60">Terminal Simulation</p>
                          <TerminalOutput lines={selected.terminal} />
                        </div>

                        <div className="rounded border border-neon/30 bg-black/30 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wider text-neon/60">Solution</p>
                            <button
                              className="text-xs text-neon hover:text-neon/80"
                              onClick={() => toggleSolution(lab.id)}
                            >
                              {state.showSolution ? "Hide" : "Show"}
                            </button>
                          </div>
                          {state.showSolution && (
                            <p className="mt-2 text-sm text-slate-300">{selected.solution}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
