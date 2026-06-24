import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Item {
  id: string;
  name: string;
  description: string | null;
  categories: { name: string } | null;
}

interface Reservation {
  id: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: string;
  items: { name: string } | null;
}

export default function UserPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState("");

  // 予約フォームの入力
  const [selectedItem, setSelectedItem] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  // 備品一覧と予約一覧を取得
  const loadData = async () => {
    try {
      const itemsRes = await apiClient.get("/items");
      setItems(itemsRes.data);
      const resvRes = await apiClient.get("/reservations");
      setReservations(resvRes.data);
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

  // 予約する
  const handleReserve = async () => {
    setMessage("");
    if (!selectedItem || !startTime || !endTime) {
      setMessage("備品・開始・終了は必須です");
      return;
    }
    try {
      await apiClient.post("/reservations", {
        item_id: selectedItem,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        purpose,
      });
      setMessage("予約しました");
      setPurpose("");
      loadData(); // 一覧を更新
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "予約に失敗しました";
      setMessage(msg);
    }
  };

  // 予約キャンセル
  const handleCancel = async (id: string) => {
    try {
      await apiClient.patch(`/reservations/${id}/cancel`);
      setMessage("キャンセルしました");
      loadData();
    } catch {
      setMessage("キャンセルに失敗しました");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>備品予約システム</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name} さん</span>
          {user?.role === "admin" && (
            <a href="/admin" style={{ marginRight: 12, color: "#60a5fa" }}>管理者画面</a>
          )}
          <button onClick={logout} style={{ padding: "6px 12px" }}>ログアウト</button>
        </div>
      </div>

      {message && <p style={{ color: "#fbbf24" }}>{message}</p>}

      {/* 予約フォーム */}
      <section style={{ marginTop: 20, padding: 16, border: "1px solid #444", borderRadius: 8 }}>
        <h2>新規予約</h2>
        <div style={{ marginBottom: 8 }}>
          <label>備品</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", color: "#e5e7eb", border: "1px solid #444", borderRadius: 4 }}
          >
            <option value="">選択してください</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}（{item.categories?.name || "未分類"}）
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>開始日時</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>終了日時</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>利用目的</label>
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)}
            style={{ width: "100%", padding: 8 }} />
        </div>
        <button onClick={handleReserve} style={{ padding: "8px 16px" }}>予約する</button>
      </section>

      {/* 予約一覧 */}
      <section style={{ marginTop: 20 }}>
        <h2>予約一覧</h2>
        {reservations.length === 0 && <p>予約はありません</p>}
        {reservations.map((r) => (
          <div key={r.id} style={{ padding: 12, marginBottom: 8, border: "1px solid #444", borderRadius: 8,
            opacity: r.status === "cancelled" ? 0.5 : 1 }}>
            <strong>{r.items?.name}</strong>
            <span style={{ marginLeft: 8, fontSize: "0.85rem", color: r.status === "active" ? "#34d399" : "#9ca3af" }}>
              {r.status === "active" ? "予約中" : "キャンセル済"}
            </span>
            <div style={{ fontSize: "0.9rem", color: "#d1d5db" }}>
              {new Date(r.start_time).toLocaleString()} 〜 {new Date(r.end_time).toLocaleString()}
            </div>
            {r.purpose && <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>目的: {r.purpose}</div>}
            {r.status === "active" && (
              <button onClick={() => handleCancel(r.id)} style={{ marginTop: 6, padding: "4px 10px", backgroundColor: "#dc2626" }}>
                キャンセル
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}