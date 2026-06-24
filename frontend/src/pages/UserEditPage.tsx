import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  // 対象ユーザーの情報を読み込む
  const loadUser = async () => {
    try {
      const res = await apiClient.get("/auth/users");
      const target = res.data.find((u: User) => u.id === id);
      if (target) {
        setName(target.name);
        setEmail(target.email);
        setRole(target.role);
      } else {
        setMessage("ユーザーが見つかりません");
      }
    } catch {
      setMessage("ユーザー情報の取得に失敗しました");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUser();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 更新
  const handleUpdate = async () => {
    setMessage("");
    try {
      const body: Record<string, string> = { name, email, role };
      if (password) body.password = password;
      await apiClient.put(`/auth/users/${id}`, body);
      setMessage("更新しました");
      setPassword("");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "更新に失敗しました";
      setMessage(msg);
    }
  };

  // 削除
  const handleDelete = async () => {
    if (!window.confirm("このユーザーを削除しますか？")) return;
    setMessage("");
    try {
      await apiClient.delete(`/auth/users/${id}`);
      navigate("/admin"); // 削除したら管理者画面に戻る
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "削除に失敗しました";
      setMessage(msg);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: 8,
    backgroundColor: "#2a2a2a",
    color: "#e5e7eb",
    border: "1px solid #444",
    borderRadius: 4,
  };

  return (
    <div style={{ maxWidth: 500, margin: "20px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>ユーザー編集</h1>
        <Link to="/admin" style={{ color: "#60a5fa" }}>← 管理者画面へ戻る</Link>
      </div>

      {message && <p style={{ color: "#fbbf24" }}>{message}</p>}

      <section style={{ marginTop: 20, padding: 16, border: "1px solid #444", borderRadius: 8 }}>
        <div style={{ marginBottom: 12 }}>
          <label>名前</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>メールアドレス</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>新しいパスワード（変更する場合のみ入力）</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="空欄なら変更しない" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>ロール</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="user">一般</option>
            <option value="admin">管理者</option>
          </select>
        </div>
        <button onClick={handleUpdate} style={{ padding: "8px 16px", marginRight: 12 }}>更新する</button>
        <button onClick={handleDelete} style={{ padding: "8px 16px", backgroundColor: "#dc2626" }}>このユーザーを削除</button>
      </section>
    </div>
  );
}