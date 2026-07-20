import { createContext, useContext, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("pt_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (token, userData) => {
    localStorage.setItem("pt_token", token);
    localStorage.setItem("pt_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("pt_token");
    localStorage.removeItem("pt_user");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);