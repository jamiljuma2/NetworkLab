import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("networklab_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data);
      } catch {
        localStorage.removeItem("networklab_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, [token]);

  const login = async (email, password) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const { data } = await api.post("/api/auth/login", { email: normalizedEmail, password: normalizedPassword });
    localStorage.setItem("networklab_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const normalizedPayload = {
      ...payload,
      name: String(payload?.name || "").trim(),
      email: String(payload?.email || "").trim().toLowerCase(),
      password: String(payload?.password || ""),
    };
    const { data } = await api.post("/api/auth/signup", normalizedPayload);
    localStorage.setItem("networklab_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("networklab_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, signup, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
