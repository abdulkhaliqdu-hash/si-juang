"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, login as apiLogin, getUser } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  refreshUser: async () => {},
});

const DEFAULT_USER: User = {
  id: 1,
  username: "admin",
  role: "kecamatan",
  display_name: "Admin Kecamatan",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("si-juang-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem("si-juang-user");
        setUser(DEFAULT_USER);
        localStorage.setItem("si-juang-user", JSON.stringify(DEFAULT_USER));
      }
    } else {
      setUser(DEFAULT_USER);
      localStorage.setItem("si-juang-user", JSON.stringify(DEFAULT_USER));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await apiLogin(username, password);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem("si-juang-user", JSON.stringify(result.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(DEFAULT_USER);
    localStorage.setItem("si-juang-user", JSON.stringify(DEFAULT_USER));
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const fresh = await getUser(user.username);
      setUser(fresh);
      localStorage.setItem("si-juang-user", JSON.stringify(fresh));
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

