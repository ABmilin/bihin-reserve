import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  categories: { name: string } | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const loadData = async () => {
    try {
      const catRes = await apiClient.get("/categories");
      setCategories(catRes.data);
      const itemRes = await apiClient.get("/items");
      setItems(itemRes.data);
      const userRes = await apiClient.get("/auth/users");
      setUsers(userRes.data);
    } catch {
      setMessage("データの取得に失敗しました");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddCategory = async () => {
    setMessage("");
    if (!newCategory) {
      setMessage("カテゴリ名を入力してください");
      return;
    }
    try {
      await apiClient.post("/categories", { name: newCategory });
      setMessage("カテゴリを追加しました");
      setNewCategory("");
      loadData();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "カテゴリの追加に失敗しました";
      setMessage(msg);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      setMessage("カテゴリを削除しました");
      loadData();
    } catch {
      setMessage("カテゴリの削除に失敗しました");
    }
  };

  const handleAddItem = async () => {
    setMessage("");
    if (!itemName) {
      setMessage("備品名を入力してください");
      return;
    }
    try {
      await apiClient.post("/items", {
        name: itemName,
        category_id: itemCategory || null,
        description: itemDesc,
      });
      setMessage("備品を追加しました");
      setItemName("");
      setItemDesc("");
      loadData();
    } catch {
      setMessage("備品の追加に失敗しました");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await apiClient.delete(`/items/${id}`);
      setMessage("備品を削除しました");
      loadData();
    } catch {
      setMessage("備品の削除に失敗しました");
    }
  };

  const handleAddUser = async () => {
    setMessage("");
    if (!newUserName || !newUserEmail || !newUserPassword) {
      setMessage("名前・メール・パスワードは必須です");
      return;
    }
    try {
      await apiClient.post("/auth/register", {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
      });
      setMessage("ユーザーを登録しました");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      loadData();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ユーザーの登録に失敗しました";
      setMessage(msg);
    }
  };

  // 検索で絞り込んだユーザー一覧
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const inputStyle = {
    width: "100%",
    padding: 8,
    backgroundColor: "#2a2a2a",
    color: "#e5e7eb",
    border: "1px solid #444",
    borderRadius: 4,
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>管理者画面</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name} さん</span>
          <Link to="/app" style={{ marginRight: 12, color: "#60a5fa" }}>予約画面へ</Link>
          <button onClick={logout} style={{ padding: "6px 12px" }}>ログアウト</button>
        </div>
      </div>

      {message && <p style={{ color: "#fbbf24" }}>{message}</p>}

      {/* カテゴリ管理 */}
      <section style={{ marginTop: 20, padding: 16, border: "1px solid #444", borderRadius: 8 }}>
        <h2>カテゴリ管理</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="新しいカテゴリ名"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleAddCategory} style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>追加</button>
        </div>
        {categories.map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #333" }}>
            <span>{c.name}</span>
            <button onClick={() => handleDeleteCategory(c.id)} style={{ padding: "4px 10px", backgroundColor: "#dc2626" }}>削除</button>
          </div>
        ))}
      </section>

      {/* 備品管理 */}
      <section style={{ marginTop: 20, padding: 16, border: "1px solid #444", borderRadius: 8 }}>
        <h2>備品管理</h2>
        <div style={{ marginBottom: 8 }}>
          <label>備品名</label>
          <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>カテゴリ</label>
          <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={inputStyle}>
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>説明</label>
          <input type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={handleAddItem} style={{ padding: "8px 16px", marginBottom: 12 }}>備品を追加</button>

        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, marginBottom: 6, border: "1px solid #333", borderRadius: 6 }}>
            <div>
              <strong>{item.name}</strong>
              <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "#9ca3af" }}>
                {item.categories?.name || "未分類"}
              </span>
              {item.description && <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>{item.description}</div>}
            </div>
            <button onClick={() => handleDeleteItem(item.id)} style={{ padding: "4px 10px", backgroundColor: "#dc2626" }}>削除</button>
          </div>
        ))}
      </section>

      {/* ユーザー登録 */}
      <section style={{ marginTop: 20, padding: 16, border: "1px solid #444", borderRadius: 8 }}>
        <h2>ユーザー登録</h2>
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          登録されたユーザーは一般ユーザー（user）として作成されます
        </p>
        <div style={{ marginBottom: 8 }}>
          <label>名前</label>
          <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>メールアドレス</label>
          <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>初期パスワード</label>
          <input type="text" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={handleAddUser} style={{ padding: "8px 16px" }}>ユーザーを登録</button>
      </section>

      {/* ユーザー一覧 */}
      <section style={{ marginTop: 20, padding: 16, border: "1px solid #444", borderRadius: 8 }}>
        <h2>ユーザー一覧（{users.length}人）</h2>
        <input
          type="text"
          placeholder="名前・メールで検索"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        {filteredUsers.length === 0 && <p style={{ color: "#9ca3af" }}>該当するユーザーがいません</p>}
        {filteredUsers.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #333" }}>
            <div>
              <strong>{u.name}</strong>
              <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "#9ca3af" }}>{u.email}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: 4,
                backgroundColor: u.role === "admin" ? "#1d4ed8" : "#374151" }}>
                {u.role === "admin" ? "管理者" : "一般"}
              </span>
              <Link to={`/admin/users/${u.id}`} style={{ fontSize: "0.85rem", color: "#60a5fa" }}>編集</Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}