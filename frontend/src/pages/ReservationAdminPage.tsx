import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

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

export default function ReservationAdminPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await apiClient.get("/reservations");
      setReservations(res.data);
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

  const handleCancel = async (id: string) => {
    try {
      await apiClient.patch(`/reservations/${id}/cancel`);
      setMessage("キャンセルしました");
      loadData();
    } catch {
      setMessage("キャンセルに失敗しました");
    }
  };

  // 検索（予約者名・備品名で絞り込み）
  const filtered = reservations.filter((r) => {
    const keyword = search.toLowerCase();
    const itemName = r.items?.name?.toLowerCase() || "";
    const userName = r.users?.name?.toLowerCase() || "";
    return itemName.includes(keyword) || userName.includes(keyword);
  });

  // 今後と過去に振り分け
  const now = new Date();
  const upcoming = filtered
    .filter((r) => r.status === "active" && new Date(r.end_time) >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const past = filtered
    .filter((r) => r.status === "cancelled" || new Date(r.end_time) < now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

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
      {/* 管理者なので、有効な予約は全てキャンセル可 */}
      {r.status === "active" && (
        <button onClick={() => handleCancel(r.id)} style={{ marginTop: 6, padding: "4px 10px", backgroundColor: "#dc2626" }}>
          キャンセル
        </button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>予約管理</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name} さん</span>
          <Link to="/admin" style={{ marginRight: 12, color: "#60a5fa" }}>← ⚙️ 管理者画面へ</Link>
        </div>
      </div>

      {message && <p style={{ color: "#fbbf24" }}>{message}</p>}

      {/* 検索 */}
      <section style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="予約者名・備品名で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", color: "#e5e7eb", border: "1px solid #444", borderRadius: 4 }}
        />
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: 4 }}>
          全{reservations.length}件中 {filtered.length}件を表示
        </p>
      </section>

      {/* 今後の予約 */}
      <section style={{ marginTop: 12 }}>
        <h2>今後の予約（{upcoming.length}件）</h2>
        {upcoming.length === 0 && <p style={{ color: "#9ca3af" }}>今後の予約はありません</p>}
        {upcoming.map(renderReservation)}
      </section>

      {/* 過去の予約 */}
      <section style={{ marginTop: 20 }}>
        <h2>過去の予約（{past.length}件）</h2>
        {past.length === 0 && <p style={{ color: "#9ca3af" }}>過去の予約はありません</p>}
        {past.map(renderReservation)}
      </section>
    </div>
  );
}