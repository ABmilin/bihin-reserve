import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../api/client";

// ユーザー情報の型
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Contextが持つ中身の型
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// アプリ全体をこれで包むと、どこからでもログイン情報が使える
export function AuthProvider({ children }: { children: ReactNode }) {
  // 起動時に、保存済みのユーザー情報があれば復元
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // ログイン処理
  const login = async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    const { token, user } = res.data;

    // トークンとユーザー情報をブラウザに保存
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 各画面から使うための便利な関数
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth は AuthProvider の中で使ってください");
  }
  return context;
}