import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// リクエストに user 情報を持たせるための型拡張
export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// 【1】ログイン必須チェック：有効なトークンがあるか確認
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    // "Bearer トークン" の形式かチェック
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "ログインが必要です" });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET が設定されていません");
      return res.status(500).json({ message: "サーバー設定エラー" });
    }

    // トークンを検証して、中の情報を取り出す
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      role: string;
    };

    req.user = { id: decoded.id, role: decoded.role };
    next(); // 問題なければ次の処理へ進む
  } catch (err) {
    return res.status(401).json({ message: "トークンが無効です" });
  }
}

// 【2】管理者限定チェック：roleがadminか確認（requireAuthの後に使う）
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "管理者権限が必要です" });
  }
  next();
}