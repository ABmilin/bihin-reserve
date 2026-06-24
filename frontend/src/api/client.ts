import axios from "axios";

// バックエンドのベースURL（開発中はローカル）
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// axios インスタンスを作成
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// リクエスト時に、保存されたトークンを自動で付ける設定
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});