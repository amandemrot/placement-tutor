import { createContext, useContext, useState } from "react";

const AuthCtx = createContext(null);

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("pt_user");
    const loginTime = localStorage.getItem("pt_login_time");

    // Enforce 24-hour strict session expiration
    if (raw && loginTime) {
      if (Date.now() - Number(loginTime) > SESSION_TIMEOUT_MS) {
        localStorage.removeItem("pt_token");
        localStorage.removeItem("pt_user");
        localStorage.removeItem("pt_login_time");
        return null;
      }
      return JSON.parse(raw);
    }
    return null;
  });

  const login = (token, userData) => {
    localStorage.setItem("pt_token", token);
    localStorage.setItem("pt_user", JSON.stringify(userData));
    localStorage.setItem("pt_login_time", String(Date.now()));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("pt_token");
    localStorage.removeItem("pt_user");
    localStorage.removeItem("pt_login_time");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);