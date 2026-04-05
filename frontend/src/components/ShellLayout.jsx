import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  const location = useLocation();
  const mainRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("networklab_compact_mode") === "true";
  });

  function resetViewportPosition() {
    if (mainRef.current) {
      mainRef.current.scrollLeft = 0;
      mainRef.current.scrollTop = 0;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  useEffect(() => {
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }
    localStorage.setItem("networklab_compact_mode", String(compactMode));
  }, [compactMode]);

  useEffect(() => {
    document.body.classList.add("app-shell-active");
    return () => document.body.classList.remove("app-shell-active");
  }, []);

  useEffect(() => {
    function handleViewportChange() {
      setMenuOpen(false);
      resetViewportPosition();
    }

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    resetViewportPosition();
  }, [location.pathname]);

  useEffect(() => {
    // Run once after initial paint to override browser scroll restoration on mobile.
    const id = window.setTimeout(resetViewportPosition, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-layout-fullbleed min-h-screen w-full max-w-full overflow-x-hidden bg-grid text-slate-100">
      <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden lg:flex-row">
        {menuOpen ? (
          <button
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={closeMenu}
            aria-label="Close sidebar overlay"
          />
        ) : null}

        <aside
          className={`glass !fixed bottom-3 left-2 top-3 z-50 flex h-[calc(100dvh-1.5rem)] w-[84vw] max-w-[20rem] flex-col rounded-xl border-r border-neon/35 p-2.5 transition-transform sm:w-[80vw] sm:p-3 lg:!sticky lg:top-0 lg:h-screen lg:w-64 lg:max-w-64 ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="border-b border-neon/30 pb-3">
              <p className="font-orbitron text-base tracking-[0.12em] text-neon sm:text-lg sm:tracking-widest">NETWORKLAB</p>
              <p className="text-[11px] leading-tight text-slate-400 break-words sm:text-xs">Vulnerability Assessment Command Center</p>
            </div>

            <nav className="mt-4 grid gap-1.5 text-xs sm:gap-2 sm:text-sm">
              {links
                .filter((link) => !link.adminOnly || user?.role === "Admin")
                .map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `rounded-md border px-2.5 py-2 text-[11px] leading-tight transition sm:px-3 sm:text-xs ${
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
          </div>

          <div className="mt-3 shrink-0 border-t border-neon/30 pt-3 text-xs text-slate-300">
            <p className="truncate">{user?.name}</p>
            <p className="text-neon/80 break-words">{user?.role}</p>
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

        <section className="relative flex w-full min-w-0 flex-1 max-w-full flex-col overflow-x-hidden">
          <header className="glass !sticky top-0 z-30 border-b border-neon/35 px-2.5 py-2.5 sm:px-3 sm:py-3 lg:hidden">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2">
              <p className="font-orbitron text-xs tracking-[0.12em] text-neon sm:text-sm sm:tracking-widest">NETWORKLAB</p>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md border border-slate-700 px-2 py-1.5 text-[10px] text-slate-200 sm:py-2"
                aria-label="Toggle navigation"
              >
                {menuOpen ? "Close" : "Menu"}
              </button>
            </div>
          </header>

          <main ref={mainRef} className="w-full max-w-full flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-2.5 py-3 sm:px-4 sm:py-4 md:p-6">
            <div className="mx-auto w-full max-w-full sm:max-w-xl lg:mx-0 lg:max-w-none">
              <Outlet />
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
