import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!form.password) {
      setError("Password is required");
      return;
    }
    if (mode === "signup") {
      if (!form.name.trim()) {
        setError("Name is required");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await signup(form);
      }
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const firstIssue = err.response?.data?.issues?.[0]?.message;
      setError(firstIssue || apiMessage || "Authentication failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid p-4">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-2xl border border-neon/40 p-4 sm:p-6">
        <h1 className="font-orbitron text-xl text-neon sm:text-2xl">NetworkLab Access</h1>
        <p className="mt-1 text-sm text-slate-400">Secure cyber range authentication</p>
        {error ? <p className="mt-3 rounded bg-red-900/40 p-2 text-sm text-red-200">{error}</p> : null}

        {mode === "signup" ? (
          <input className="input mt-4" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        ) : null}
        <input className="input mt-3" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
        <input className="input mt-3" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />

        <button className="btn-primary mt-4 w-full" type="submit">
          {mode === "login" ? "Login" : "Create Account"}
        </button>

        <button
          type="button"
          className="mt-3 text-sm text-neon/80 underline"
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>

      </form>
    </div>
  );
}
