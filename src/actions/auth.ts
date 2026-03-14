"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const employeeNumber = formData.get("employeeNumber") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { employeeNumber, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "社員番号またはパスワードが正しくありません。アカウントが無効になっている可能性があります。" };
    }
    throw error;
  }

  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
