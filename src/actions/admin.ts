"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ============================================================
// 型定義
// ============================================================

export type BreakWithTimes = {
  id: string;
  attendanceId: string;
  breakStart: Date;
  breakEnd: Date | null;
  latitude: number | null;
  longitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
};

export type AttendanceWithUser = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    department: { id: string; name: string } | null;
  };
  clockIn: Date;
  clockOut: Date | null;
  note: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  breaks: BreakWithTimes[];
  createdAt: Date;
};

// ============================================================
// バリデーションスキーマ
// ============================================================

const updateUserSchema = z.object({
  name: z.string().min(1, "名前は1文字以上で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

const createUserSchema = z.object({
  employeeNumber: z.string().min(1, "社員番号を入力してください"),
  name: z.string().min(1, "名前は1文字以上で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  role: z.enum(["ADMIN", "EMPLOYEE"] as const, {
    error: "ロールはADMINまたはEMPLOYEEを指定してください",
  }),
  departmentId: z.string().optional(),
  kioskCode: z
    .string()
    .regex(/^\d{4}$/, "キオスクコードは4桁の数字で入力してください")
    .optional()
    .or(z.literal("")),
});

// ============================================================
// ユーザー管理アクション
// ============================================================

/**
 * 指定IDのユーザーを取得する。
 */
export async function getUserById(
  userId: string
): Promise<{
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
} | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, employeeNumber: true, name: true, email: true, role: true, departmentId: true },
    });
  } catch {
    return null;
  }
}

/**
 * ユーザーの名前・メールアドレスを更新する。
 */
export async function updateUser(
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
  if (!userId) {
    return { success: false, message: "ユーザーIDが指定されていません" };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
  };

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, message: firstError.message };
  }

  const { name, email } = parsed.data;

  try {
    // メールアドレスの重複チェック（自分自身は除外）
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      return { success: false, message: "このメールアドレスはすでに使用されています" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "ユーザー情報を更新しました" };
}

/**
 * 全ユーザー一覧を取得する（createdAt昇順）。
 */
export async function getAllUsers(): Promise<
  {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    departmentId: string | null;
    department: { id: string; name: string } | null;
    isActive: boolean;
    kioskCode: string | null;
  }[]
> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        isActive: true,
        kioskCode: true,
      },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return [];
  }
}

/**
 * 新規ユーザーを作成する。
 */
export async function createUser(
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

  const raw = {
    employeeNumber: formData.get("employeeNumber") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
    departmentId: (formData.get("departmentId") as string) || undefined,
    kioskCode: (formData.get("kioskCode") as string) || undefined,
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, message: firstError.message };
  }

  const { employeeNumber, name, email, password, role, departmentId, kioskCode } = parsed.data;

  try {
    // 社員番号の重複チェック
    const existingByNumber = await prisma.user.findUnique({ where: { employeeNumber } });
    if (existingByNumber) {
      return { success: false, message: "この社員番号はすでに使用されています" };
    }

    // メールアドレスの重複チェック
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "このメールアドレスはすでに使用されています" };
    }

    // キオスクコードの重複チェック
    if (kioskCode) {
      const existingKiosk = await prisma.user.findUnique({ where: { kioskCode } });
      if (existingKiosk) {
        return { success: false, message: "このキオスクコードはすでに使用されています" };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        employeeNumber,
        name,
        email,
        password: hashedPassword,
        role,
        departmentId: departmentId ?? null,
        kioskCode: kioskCode || null,
      },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "ユーザーを作成しました" };
}

/**
 * ユーザーを削除する（自分自身は削除不可）。
 */
export async function deleteUser(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { success: false, message: "ユーザーIDが指定されていません" };
  }

  if (userId === adminId) {
    return { success: false, message: "自分自身を削除することはできません" };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "ユーザーを削除しました" };
}

/**
 * ユーザーの有効/無効ステータスを切り替える（自分自身は変更不可）。
 */
export async function toggleUserStatus(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { success: false, message: "ユーザーIDが指定されていません" };
  }

  if (userId === adminId) {
    return { success: false, message: "自分自身のステータスを変更することはできません" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    if (!user) {
      return { success: false, message: "ユーザーが見つかりません" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    revalidatePath("/admin/users");
    return { success: true, message: user.isActive ? "ユーザーを無効にしました" : "ユーザーを有効にしました" };
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }
}

/**
 * ユーザーのロールを変更する（自分自身のロール変更は不可）。
 */
export async function updateUserRole(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "権限エラーが発生しました",
    };
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;

  if (!userId) {
    return { success: false, message: "ユーザーIDが指定されていません" };
  }

  if (userId === adminId) {
    return { success: false, message: "自分自身のロールを変更することはできません" };
  }

  if (role !== "ADMIN" && role !== "EMPLOYEE") {
    return { success: false, message: "ロールはADMINまたはEMPLOYEEを指定してください" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "ロールを更新しました" };
}

// ============================================================
// 勤怠管理アクション
// ============================================================

/**
 * 全ユーザーの指定月の勤怠を取得する。
 * ユーザー名昇順、clockIn昇順でソートして返す。
 */
export async function getAllMonthlyAttendances(
  year: number,
  month: number,
  departmentId?: string
): Promise<AttendanceWithUser[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    return await prisma.attendance.findMany({
      where: {
        clockIn: { gte: start, lte: end },
        ...(departmentId ? { user: { departmentId } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
        breaks: { orderBy: { breakStart: "asc" } },
      },
      orderBy: [{ user: { name: "asc" } }, { clockIn: "asc" }],
    });
  } catch {
    return [];
  }
}

/**
 * 打刻時刻を直接更新する（管理者専用）。
 */
export async function updateAttendance(
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

  const attendanceId = formData.get("attendanceId") as string;
  const clockInStr = formData.get("clockIn") as string;
  const clockOutStr = formData.get("clockOut") as string | null;
  const note = (formData.get("note") as string) || null;

  if (!attendanceId || !clockInStr) {
    return { success: false, message: "必須項目が入力されていません" };
  }

  const clockIn = new Date(clockInStr);
  if (isNaN(clockIn.getTime())) {
    return { success: false, message: "出勤時刻の形式が正しくありません" };
  }

  let clockOut: Date | null = null;
  if (clockOutStr) {
    clockOut = new Date(clockOutStr);
    if (isNaN(clockOut.getTime())) {
      return { success: false, message: "退勤時刻の形式が正しくありません" };
    }
    if (clockOut <= clockIn) {
      return { success: false, message: "退勤時刻は出勤時刻より後にしてください" };
    }
  }

  try {
    await prisma.attendance.update({
      where: { id: attendanceId },
      data: { clockIn, clockOut, note },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/attendance");
  return { success: true, message: "打刻時刻を更新しました" };
}

// ============================================================
// 休憩管理アクション
// ============================================================

/**
 * 休憩を追加する（管理者専用）。
 */
export async function addBreak(
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

  const attendanceId = formData.get("attendanceId") as string;
  const breakStartStr = formData.get("breakStart") as string;
  const breakEndStr = formData.get("breakEnd") as string | null;

  if (!attendanceId || !breakStartStr) {
    return { success: false, message: "必須項目が入力されていません" };
  }

  const breakStart = new Date(breakStartStr);
  if (isNaN(breakStart.getTime())) {
    return { success: false, message: "休憩開始時刻の形式が正しくありません" };
  }

  let breakEnd: Date | null = null;
  if (breakEndStr) {
    breakEnd = new Date(breakEndStr);
    if (isNaN(breakEnd.getTime())) {
      return { success: false, message: "休憩終了時刻の形式が正しくありません" };
    }
    if (breakEnd <= breakStart) {
      return { success: false, message: "休憩終了時刻は休憩開始時刻より後にしてください" };
    }
  }

  try {
    await prisma.break.create({
      data: {
        attendanceId,
        breakStart,
        breakEnd,
      },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/attendance");
  return { success: true, message: "休憩を追加しました" };
}

/**
 * 休憩を更新する（管理者専用）。
 */
export async function updateBreak(
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

  const breakId = formData.get("breakId") as string;
  const breakStartStr = formData.get("breakStart") as string;
  const breakEndStr = formData.get("breakEnd") as string | null;

  if (!breakId || !breakStartStr) {
    return { success: false, message: "必須項目が入力されていません" };
  }

  const breakStart = new Date(breakStartStr);
  if (isNaN(breakStart.getTime())) {
    return { success: false, message: "休憩開始時刻の形式が正しくありません" };
  }

  let breakEnd: Date | null = null;
  if (breakEndStr) {
    breakEnd = new Date(breakEndStr);
    if (isNaN(breakEnd.getTime())) {
      return { success: false, message: "休憩終了時刻の形式が正しくありません" };
    }
    if (breakEnd <= breakStart) {
      return { success: false, message: "休憩終了時刻は休憩開始時刻より後にしてください" };
    }
  }

  try {
    await prisma.break.update({
      where: { id: breakId },
      data: { breakStart, breakEnd },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/attendance");
  return { success: true, message: "休憩を更新しました" };
}

/**
 * 休憩を削除する（管理者専用）。
 */
export async function deleteBreak(
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

  const breakId = formData.get("breakId") as string;
  if (!breakId) {
    return { success: false, message: "休憩IDが指定されていません" };
  }

  try {
    await prisma.break.delete({ where: { id: breakId } });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/admin/attendance");
  return { success: true, message: "休憩を削除しました" };
}
