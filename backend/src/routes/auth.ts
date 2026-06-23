import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase";

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

export default router;