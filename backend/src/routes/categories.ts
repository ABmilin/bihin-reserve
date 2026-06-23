import { Router } from "express";
import { supabase } from "../supabase";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// 【一覧取得】カテゴリ一覧（ログインユーザーなら誰でも閲覧可）
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("カテゴリ取得エラー:", error.message);
    return res.status(500).json({ message: "カテゴリの取得に失敗しました" });
  }

  res.json(data);
});

// 【作成】カテゴリ追加（管理者のみ）
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "カテゴリ名は必須です" });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();

  if (error) {
    // 同名カテゴリが既にある場合（unique制約違反）
    if (error.code === "23505") {
      return res.status(409).json({ message: "同じ名前のカテゴリが既にあります" });
    }
    console.error("カテゴリ作成エラー:", error.message);
    return res.status(500).json({ message: "カテゴリの作成に失敗しました" });
  }

  res.status(201).json(data);
});

// 【削除】カテゴリ削除（管理者のみ）
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error("カテゴリ削除エラー:", error.message);
    return res.status(500).json({ message: "カテゴリの削除に失敗しました" });
  }

  res.json({ message: "カテゴリを削除しました" });
});

export default router;