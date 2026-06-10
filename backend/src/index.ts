import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// .env ファイルから環境変数を読み込む
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ミドルウェア設定
app.use(cors());          // フロントとの通信を許可
app.use(express.json());  // JSONのリクエストを受け取れるように

// 動作確認用のエンドポイント
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "サーバーは正常に動作しています 🚀" });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});
