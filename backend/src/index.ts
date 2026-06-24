import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabase";
import authRouter from "./routes/auth";
import { requireAuth, requireAdmin } from "./middleware/auth";
import categoriesRouter from "./routes/categories";
import itemsRouter from "./routes/items";
import reservationsRouter from "./routes/reservations";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 許可するフロントエンドのURL（環境変数 or ローカル）
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// 認証関連のAPI（/api/auth/register など）
app.use("/api/auth", authRouter);

app.use("/api/categories", categoriesRouter);

app.use("/api/items", itemsRouter);

app.use("/api/reservations", reservationsRouter);

// 【テスト用】ログインが必要なAPI
app.get("/api/me", requireAuth, (req: any, res) => {
  res.json({ message: "ログイン確認OK", user: req.user });
});

// 【テスト用】管理者だけがアクセスできるAPI
app.get("/api/admin-only", requireAuth, requireAdmin, (req: any, res) => {
  res.json({ message: "管理者ページへようこそ！" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "サーバーは正常に動作しています" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const { error } = await supabase
      .from("_realtime_test_dummy")
      .select("*")
      .limit(1);

    const tableNotFound =
      error &&
      (error.code === "42P01" ||
        error.message.includes("Could not find the table"));

    if (error && !tableNotFound) {
      console.error("Supabase connection error:", error.message);
      return res.status(500).json({ status: "error", message: error.message });
    }

    res.json({
      status: "ok",
      message: "Supabaseへの接続に成功しました",
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ status: "error", message: "接続に失敗しました" });
  }
});

app.listen(PORT, () => {
  console.log("Server started: http://localhost:" + PORT);
});