"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// プロフィール取得
export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("認証が必要です");

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, employeeNumber: true, department: { select: { name: true } } },
    });

    if (!user) throw new Error("ユーザーが見つかりません");

    return {
      name: user.name,
      email: user.email,
      employeeNumber: user.employeeNumber,
      departmentName: user.department?.name ?? null,
    };
  } catch {
    throw new Error("プロフィール情報の取得に失敗しました");
  }
}

// プロフィール更新
const updateProfileSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
});

export async function updateProfile(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "認証が必要です" };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true, message: "プロフィールを更新しました" };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください"),
  confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "新しいパスワードが一致しません",
  path: ["confirmPassword"],
});

export async function changePassword(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "認証が必要です" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    // 現在のユーザーをDBから取得
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { success: false, message: "ユーザーが見つかりません" };

    // 現在のパスワードを検証
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return { success: false, message: "現在のパスワードが正しくありません" };

    // 新しいパスワードが現在と同じ場合はエラー
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) return { success: false, message: "新しいパスワードは現在と異なるものにしてください" };

    // パスワードを更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  return { success: true, message: "パスワードを変更しました" };
}
