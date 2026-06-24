import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // ログインボタンを押したときの処理
  const handleLogin = async () => {
    setError("");
    try {
      await login(email, password);
      navigate("/app"); // ログイン成功 → 一般ユーザー画面へ
    } catch  {
      setError("メールアドレスまたはパスワードが正しくありません");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 20 }}>
      <h1>備品予約システム</h1>
      <h2>ログイン</h2>

      <div style={{ marginBottom: 12 }}>
        <label>メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        onClick={handleLogin}
        style={{ width: "100%", padding: 10, cursor: "pointer" }}
      >
        ログイン
      </button>
    </div>
  );
}