import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * React cache() でリクエスト内で auth() を1回だけ実行する。
 * auth() が throw しても null を返す（安全なフォールバック）。
 */
export const getSession = cache(async () => {
  try {
    return await auth();
  } catch {
    return null;
  }
});
