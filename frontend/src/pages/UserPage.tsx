import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  user_id: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: string;
  items: { name: string } | null;
  users: { name: string } | null;
}

export default function UserPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState("");

  const [selectedItem, setSelectedItem] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

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

  const handleReserve = async () => {
    setMessage("");
    if (!selectedItem || !startTime || !endTime) {
      setMessage("備品・開始・終了は必須です");
      return;
    }
    if (purpose.length > 500) {
      setMessage("利用目的は500文字以内で入力してください");
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
      loadData();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "予約に失敗しました";
      setMessage(msg);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiClient.patch(`/reservations/${id}/cancel`);
      setMessage("キャンセルしました");
      loadData();
    } catch {
      setMessage("キャンセルに失敗しました");
    }
  };

  // 今後と過去に振り分ける
  const now = new Date();
  const upcoming = reservations
    .filter((r) => r.status === "active" && new Date(r.end_time) >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const past = reservations
    .filter((r) => r.status === "cancelled" || new Date(r.end_time) < now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // 一般ユーザーは過去10個まで、管理者は全部
  const visiblePast = user?.role === "admin" ? past : past.slice(0, 10);

  // 予約カードの表示（共通）
  const renderReservation = (r: Reservation) => (
    <div key={r.id} style={{ padding: 12, marginBottom: 8, border: "1px solid #444", borderRadius: 8,
      opacity: r.status === "cancelled" ? 0.5 : 1 }}>
      <strong>{r.items?.name}</strong>
      <span style={{ marginLeft: 8, fontSize: "0.85rem", color: r.status === "active" ? "#34d399" : "#9ca3af" }}>
        {r.status === "active" ? "予約中" : "キャンセル済"}
      </span>
      <div style={{ fontSize: "0.9rem", color: "#d1d5db" }}>
        {new Date(r.start_time).toLocaleString()} 〜 {new Date(r.end_time).toLocaleString()}
      </div>
      <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>予約者: {r.users?.name || "不明"} さん</div>
      {r.purpose && <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>目的: {r.purpose}</div>}
      {/* 自分の予約 or 管理者ならキャンセル可。有効な予約のみ */}
      {r.status === "active" && (r.user_id === user?.id || user?.role === "admin") && (
        <button onClick={() => handleCancel(r.id)} style={{ marginTop: 6, padding: "4px 10px", backgroundColor: "#dc2626" }}>
          キャンセル
        </button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>備品予約システム</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name} さん</span>
          {user?.role === "admin" && (
            <Link to="/admin" style={{ marginRight: 12, color: "#60a5fa" }}>⚙️ 管理者画面</Link>
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
          <label>利用目的（{purpose.length}/500）</label>
          <input type="text" value={purpose} maxLength={500} onChange={(e) => setPurpose(e.target.value)}
            style={{ width: "100%", padding: 8 }} />
        </div>
        <button onClick={handleReserve} style={{ padding: "8px 16px" }}>予約する</button>
      </section>

      {/* 今後の予約 */}
      <section style={{ marginTop: 20 }}>
        <h2>今後の予約</h2>
        {upcoming.length === 0 && <p style={{ color: "#9ca3af" }}>今後の予約はありません</p>}
        {upcoming.map(renderReservation)}
      </section>

      {/* 過去の予約 */}
      <section style={{ marginTop: 20 }}>
        <h2>
          過去の予約
          {user?.role !== "admin" && past.length > 10 && (
            <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginLeft: 8 }}>（最新10件のみ表示）</span>
          )}
        </h2>
        {visiblePast.length === 0 && <p style={{ color: "#9ca3af" }}>過去の予約はありません</p>}
        {visiblePast.map(renderReservation)}
      </section>
    </div>
  );
}