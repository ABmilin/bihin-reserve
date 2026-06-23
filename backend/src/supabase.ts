import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// .env から環境変数を読み込む
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// 環境変数が設定されているかチェック（設定漏れを早期発見）
if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "❌ SUPABASE_URL または SUPABASE_SECRET_KEY が .env に設定されていません"
  );
}

// Supabaseクライアントを作成（サーバー側なのでSECRET_KEYを使用）
export const supabase = createClient(supabaseUrl, supabaseSecretKey);
