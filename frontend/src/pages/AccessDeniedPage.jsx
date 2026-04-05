import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AccessDeniedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid p-4 text-slate-100">
      <div className="glass w-full max-w-xl rounded-2xl border border-red-500/40 p-6 shadow-[0_0_60px_rgba(239,68,68,0.12)]">
        <p className="font-orbitron text-sm tracking-[0.3em] text-red-300">ACCESS DENIED</p>
        <h1 className="mt-3 text-3xl font-bold text-neon">Admin privileges required</h1>
        <p className="mt-3 text-sm text-slate-300">
          The Admin Panel is restricted to users with the Admin role.
          {user ? (
            <span className="block mt-2 text-slate-400">
              Current account: {user.email} ({user.role})
            </span>
          ) : null}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-primary" to="/">
            Go to Dashboard
          </Link>
          <Link className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-neon/60 hover:text-neon" to="/login">
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}