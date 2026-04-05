import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: "🛡️" },
  { to: "/scanner", label: "Network Scanner", icon: "📡" },
  { to: "/topology", label: "Network Topology", icon: "🗺️" },
  { to: "/vulnerabilities", label: "Vulnerabilities", icon: "⚠️" },
  { to: "/packets", label: "Packet Analysis", icon: "🔍" },
  { to: "/labs", label: "Labs", icon: "🧪" },
  { to: "/reports", label: "Reports", icon: "📑" },
  { to: "/admin", label: "Admin Panel", icon: "⚙️", adminOnly: true },
  { to: "/audit-logs", label: "Audit Logs", icon: "📋", adminOnly: true },
];

export default function ShellLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("networklab_compact_mode") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }
    localStorage.setItem("networklab_compact_mode", String(compactMode));
  }, [compactMode]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-grid text-slate-100">
      <div className="flex min-h-screen">
        {menuOpen ? (
          <button
            className="fixed inset-0 z-40 bg-black/60 sm:hidden"
            onClick={closeMenu}
            aria-label="Close sidebar overlay"
          />
        ) : null}

        <aside
          className={`glass fixed inset-y-0 left-0 z-50 w-64 border-r border-neon/35 p-3 transition-transform sm:sticky sm:top-0 sm:h-screen ${
            menuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          }`}
        >
          <div className="border-b border-neon/30 pb-3">
            <p className="font-orbitron text-lg tracking-widest text-neon">NETWORKLAB</p>
            <p className="text-xs text-slate-400">Vulnerability Assessment Command Center</p>
          </div>

          <nav className="mt-4 grid gap-2 text-sm">
            {links
              .filter((link) => !link.adminOnly || user?.role === "Admin")
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-md border px-3 py-2 transition ${
                      isActive
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-slate-700 text-slate-300 hover:border-neon/60 hover:text-neon"
                    }`
                  }
                >
                  <span className="mr-2">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
          </nav>

          <div className="mt-4 border-t border-neon/30 pt-3 text-xs text-slate-300">
            <p className="truncate">{user?.name}</p>
            <p className="text-neon/80">{user?.role}</p>
          </div>

          <div className="mt-3 grid gap-2">
            <button
              onClick={() => setCompactMode((v) => !v)}
              className="rounded-md border border-slate-700 px-2 py-2 text-[10px] text-slate-200 hover:border-neon/60"
              aria-label="Toggle compact mode"
              title="Toggle compact mode for dense data views"
            >
              {compactMode ? "Comfort Mode" : "Compact Mode"}
            </button>
            <button onClick={logout} className="btn-primary w-full px-3 py-2 text-xs">Logout</button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-30 border-b border-neon/35 px-3 py-3 sm:hidden">
            <div className="flex items-center justify-between gap-2">
              <p className="font-orbitron text-sm tracking-widest text-neon">NETWORKLAB</p>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md border border-slate-700 px-2 py-2 text-[10px] text-slate-200"
                aria-label="Toggle navigation"
              >
                {menuOpen ? "Close" : "Menu"}
              </button>
            </div>
          </header>

          <main className="w-full p-3 sm:p-4 md:p-6">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  );
}
