import { Router } from "express";
import { supabase } from "../supabase";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// 【一覧取得】備品一覧（カテゴリ名も一緒に取得）
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name)")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("備品取得エラー:", error.message);
    return res.status(500).json({ message: "備品の取得に失敗しました" });
  }

  res.json(data);
});

// 【作成】備品追加（管理者のみ）
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, category_id, description, image_url } = req.body;

  if (!name) {
    return res.status(400).json({ message: "備品名は必須です" });
  }

  const { data, error } = await supabase
    .from("items")
    .insert({ name, category_id, description, image_url })
    .select("*, categories(name)")
    .single();

  if (error) {
    console.error("備品作成エラー:", error.message);
    return res.status(500).json({ message: "備品の作成に失敗しました" });
  }

  res.status(201).json(data);
});

// 【更新】備品編集（管理者のみ）
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description, image_url } = req.body;

  const { data, error } = await supabase
    .from("items")
    .update({ name, category_id, description, image_url })
    .eq("id", id)
    .select("*, categories(name)")
    .single();

  if (error) {
    console.error("備品更新エラー:", error.message);
    return res.status(500).json({ message: "備品の更新に失敗しました" });
  }

  res.json(data);
});

// 【削除】備品削除（管理者のみ）
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) {
    console.error("備品削除エラー:", error.message);
    return res.status(500).json({ message: "備品の削除に失敗しました" });
  }

  res.json({ message: "備品を削除しました" });
});

export default router;