"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";

// ============================================================
// 型定義
// ============================================================

export type DepartmentItem = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { users: number };
};

// ============================================================
// 部署取得アクション
// ============================================================

export async function getAllDepartments(): Promise<DepartmentItem[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  try {
    return await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getDepartmentOptions(): Promise<{ id: string; name: string }[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  try {
    return await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

// ============================================================
// 部署作成アクション
// ============================================================

export async function createDepartment(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length === 0) {
    return { success: false, message: "部署名を入力してください" };
  }
  if (name.length > 100) {
    return { success: false, message: "部署名は100文字以内で入力してください" };
  }

  try {
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return { success: false, message: "同名の部署がすでに存在します" };
    }

    await prisma.department.create({ data: { name } });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/departments");
  return { success: true, message: "部署を作成しました" };
}

// ============================================================
// 部署名変更アクション
// ============================================================

export async function renameDepartment(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const departmentId = formData.get("departmentId") as string;
  if (!departmentId) {
    return { success: false, message: "部署IDが指定されていません" };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length === 0) {
    return { success: false, message: "部署名を入力してください" };
  }
  if (name.length > 100) {
    return { success: false, message: "部署名は100文字以内で入力してください" };
  }

  try {
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing && existing.id !== departmentId) {
      return { success: false, message: "同名の部署がすでに存在します" };
    }

    await prisma.department.update({
      where: { id: departmentId },
      data: { name },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");
  return { success: true, message: "部署名を変更しました" };
}

// ============================================================
// 部署削除アクション
// ============================================================

export async function deleteDepartment(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const departmentId = formData.get("departmentId") as string;
  if (!departmentId) {
    return { success: false, message: "部署IDが指定されていません" };
  }

  try {
    await prisma.department.delete({ where: { id: departmentId } });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");
  return { success: true, message: "部署を削除しました" };
}

// ============================================================
// 部署割り当てアクション
// ============================================================

export async function assignDepartment(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const userId = formData.get("userId") as string;
  const departmentId = formData.get("departmentId") as string;

  if (!userId) {
    return { success: false, message: "ユーザーIDが指定されていません" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { departmentId: departmentId || null },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "部署を更新しました" };
}
