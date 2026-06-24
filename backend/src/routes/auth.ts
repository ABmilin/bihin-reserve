import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// ユーザー登録 API
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 入力チェック
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "email, password, name は必須です" });
    }

    // 既に同じemailが登録されていないか確認
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: "このemailは既に登録されています" });
    }

    // パスワードをハッシュ化（そのまま保存しない）
    const passwordHash = await bcrypt.hash(password, 10);

    // ユーザーを登録（role は デフォルトで 'user'）
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash, name })
      .select("id, email, name, role")
      .single();

    if (error) {
      console.error("登録エラー:", error.message);
      return res.status(500).json({ message: "登録に失敗しました" });
    }

    res.status(201).json({ message: "登録に成功しました", user: newUser });
  } catch (err) {
    console.error("予期しないエラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// ログイン API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 入力チェック
    if (!email || !password) {
      return res.status(400).json({ message: "email と password は必須です" });
    }

    // emailでユーザーを検索
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, role, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error || !user) {
      return res
        .status(401)
        .json({ message: "emailまたはpasswordが正しくありません" });
    }

    // パスワードを照合
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "emailまたはpasswordが正しくありません" });
    }

    // JWTトークンを発行（idとroleを含める）
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET が設定されていません");
      return res.status(500).json({ message: "サーバー設定エラー" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: "7d" } // 7日間有効
    );

    // パスワードハッシュは返さない
    res.json({
      message: "ログインに成功しました",
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("予期しないエラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// 【一覧取得】ユーザー一覧（管理者のみ）
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ユーザー取得エラー:", error.message);
    return res.status(500).json({ message: "ユーザーの取得に失敗しました" });
  }

  res.json(data);
});

// 【ユーザー更新】名前・メール・パスワード・ロールを変更（管理者のみ）
router.put("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    // 対象ユーザーを取得
    const { data: target } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (!target) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // 管理者を一般に降格する場合、最後の管理者でないか確認
    if (target.role === "admin" && role === "user") {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count || 0) <= 1) {
        return res
          .status(400)
          .json({ message: "管理者が0人になるため、降格できません" });
      }
    }

    // 更新内容を組み立て（入力があった項目だけ更新）
    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, name, role")
      .single();

    if (error) {
      // メール重複
      if (error.code === "23505") {
        return res.status(409).json({ message: "このメールは既に使われています" });
      }
      console.error("ユーザー更新エラー:", error.message);
      return res.status(500).json({ message: "ユーザーの更新に失敗しました" });
    }

    res.json({ message: "ユーザーを更新しました", user: data });
  } catch (err) {
    console.error("予期しないエラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// 【ユーザー削除】（管理者のみ・最後の管理者は削除不可）
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: target } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (!target) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // 管理者を削除する場合、最後の管理者でないか確認
    if (target.role === "admin") {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count || 0) <= 1) {
        return res
          .status(400)
          .json({ message: "管理者が0人になるため、削除できません" });
      }
    }

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("ユーザー削除エラー:", error.message);
      return res.status(500).json({ message: "ユーザーの削除に失敗しました" });
    }

    res.json({ message: "ユーザーを削除しました" });
  } catch (err) {
    console.error("予期しないエラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

export default router;