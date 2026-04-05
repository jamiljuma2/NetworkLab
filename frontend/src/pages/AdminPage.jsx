import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [rules, setRules] = useState(null);
  const [pendingExecutions, setPendingExecutions] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Student" });

  async function load() {
    const [u, l, r, e] = await Promise.all([
      api.get("/api/auth/users"),
      api.get("/api/admin/logs"),
      api.get("/api/admin/scan-rules"),
      api.get("/api/labs/executions", { params: { status: "pending_approval" } }),
    ]);
    setUsers(u.data);
    setLogs(l.data.slice(0, 20));
    setRules(r.data);
    setPendingExecutions(e.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser() {
    await api.post("/api/admin/users", newUser);
    setNewUser({ name: "", email: "", role: "Student" });
    load();
  }

  async function updateRules(key, value) {
    const next = { ...rules, [key]: value };
    setRules(next);
    await api.put("/api/admin/scan-rules", next);
  }

  async function approveExecution(executionId) {
    await api.post(`/api/labs/executions/${executionId}/approve`);
    load();
  }

  async function rejectExecution(executionId) {
    await api.post(`/api/labs/executions/${executionId}/reject`);
    load();
  }

  return (
    <div className="dense-view space-y-4">
      <section className="glass ui-smooth rounded-xl border border-neon/30 p-4">
        <h2 className="font-orbitron text-neon">User Management</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <input className="input" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))} />
          <input className="input" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} />
          <select className="input" value={newUser.role} onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}>
            <option>Student</option>
            <option>Analyst</option>
            <option>Admin</option>
          </select>
          <button className="btn-primary ui-smooth sm:col-span-2 xl:col-span-1" onClick={createUser}>Create User</button>
        </div>

        <ul className="dense-list mt-3 space-y-2 text-sm">
          {users.map((user) => (
            <li key={user.id} className="ui-card-interactive rounded border border-slate-700 p-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="truncate">{user.name}</span>
                <span className="break-all text-slate-300">{user.email}</span>
                <span className="text-neon/80">{user.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass ui-smooth rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">Scan Rule Configuration</h3>
        {rules ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rules.enableTopology} onChange={(e) => updateRules("enableTopology", e.target.checked)} />
              Enable topology module
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rules.enablePacketSim} onChange={(e) => updateRules("enablePacketSim", e.target.checked)} />
              Enable packet simulator
            </label>
          </div>
        ) : null}
      </section>

      <section className="glass ui-smooth rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">Safe Execution Approvals</h3>
        {pendingExecutions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No pending lab execution requests.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {pendingExecutions.map((execution) => (
              <li key={execution.id} className="ui-card-interactive rounded border border-slate-700 p-3">
                <p className="text-neon">{execution.labTitle}</p>
                <p className="mt-1 text-xs text-slate-300">
                  Requestor: {execution.requestedBy} | {execution.httpMethod} {execution.routePath}
                </p>
                <p className="mt-1 text-xs text-slate-300">Target: {execution.target}</p>
                {execution.notes ? <p className="mt-1 text-xs text-slate-400">Notes: {execution.notes}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-primary ui-smooth w-full text-xs sm:w-auto" onClick={() => approveExecution(execution.id)}>Approve</button>
                  <button className="btn-primary ui-smooth w-full text-xs sm:w-auto" onClick={() => rejectExecution(execution.id)}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass ui-smooth rounded-xl border border-neon/30 p-4">
        <h3 className="font-orbitron text-neon">System Logs</h3>
        <ul className="dense-list mt-3 space-y-2 text-xs text-slate-300">
          {logs.map((log) => (
            <li key={log.id} className="rounded border border-slate-700 p-2 break-words">[{new Date(log.createdAt).toLocaleTimeString()}] {log.type.toUpperCase()} {log.message}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
