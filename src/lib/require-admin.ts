import { auth } from "@/lib/auth";

/**
 * セッションからADMINロールを検証し、ログインユーザーのIDを返す。
 * サーバーアクションからも確実に動作するよう auth() を直接呼ぶ。
 */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("認証が必要です");
  const role = (session.user as { id: string; role?: string }).role;
  if (role !== "ADMIN") throw new Error("管理者権限が必要です");
  return session.user.id;
}
