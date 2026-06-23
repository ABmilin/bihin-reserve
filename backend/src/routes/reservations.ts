import { Router } from "express";
import { supabase } from "../supabase";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// 【一覧取得】予約一覧（備品名・ユーザー名も一緒に取得）
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("reservations")
    .select("*, items(name), users(name)")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("予約取得エラー:", error.message);
    return res.status(500).json({ message: "予約の取得に失敗しました" });
  }

  res.json(data);
});

// 【作成】予約する（ログインユーザー）＋ダブルブッキング防止
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { item_id, start_time, end_time, purpose } = req.body;
  const user_id = req.user!.id;

  // 入力チェック
  if (!item_id || !start_time || !end_time) {
    return res
      .status(400)
      .json({ message: "item_id, start_time, end_time は必須です" });
  }

  // 開始 < 終了 のチェック
  if (new Date(start_time) >= new Date(end_time)) {
    return res
      .status(400)
      .json({ message: "終了時刻は開始時刻より後にしてください" });
  }

  // 【ダブルブッキング防止】同じ備品で時間帯が重なる有効な予約がないか確認
  const { data: conflicts, error: conflictError } = await supabase
    .from("reservations")
    .select("id")
    .eq("item_id", item_id)
    .eq("status", "active")
    .lt("start_time", end_time)   // 既存予約の開始 < 新規の終了
    .gt("end_time", start_time);  // 既存予約の終了 > 新規の開始

  if (conflictError) {
    console.error("重複チェックエラー:", conflictError.message);
    return res.status(500).json({ message: "予約の確認に失敗しました" });
  }

  if (conflicts && conflicts.length > 0) {
    return res
      .status(409)
      .json({ message: "この時間帯はすでに予約されています" });
  }

  // 予約を作成
  const { data, error } = await supabase
    .from("reservations")
    .insert({ item_id, user_id, start_time, end_time, purpose })
    .select("*, items(name), users(name)")
    .single();

  if (error) {
    console.error("予約作成エラー:", error.message);
    return res.status(500).json({ message: "予約の作成に失敗しました" });
  }

  res.status(201).json(data);
});

// 【キャンセル】予約をキャンセル（自分の予約のみ）
router.patch("/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const user_id = req.user!.id;

  // 自分の予約か確認
  const { data: reservation } = await supabase
    .from("reservations")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!reservation) {
    return res.status(404).json({ message: "予約が見つかりません" });
  }

  // 本人 or 管理者だけキャンセル可能
  if (reservation.user_id !== user_id && req.user!.role !== "admin") {
    return res
      .status(403)
      .json({ message: "自分の予約のみキャンセルできます" });
  }

  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("キャンセルエラー:", error.message);
    return res.status(500).json({ message: "キャンセルに失敗しました" });
  }

  res.json({ message: "予約をキャンセルしました", reservation: data });
});

export default router;