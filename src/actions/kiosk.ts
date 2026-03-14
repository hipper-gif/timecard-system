"use server";

import { prisma } from "@/lib/db";
import { getResolvedWorkRule } from "@/actions/workrule";
import { revalidatePath } from "next/cache";

function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getKioskDepartments(): Promise<{ id: string; name: string }[]> {
  try {
    return await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getDepartmentName(departmentId: string): Promise<string | null> {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { name: true },
    });
    return dept?.name ?? null;
  } catch {
    return null;
  }
}

type KioskLookupResult = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    status: "not_started" | "clocked_in" | "on_break" | "clocked_out";
    clockInTime: string | null;
  };
};

export async function lookupUserByKioskCode(
  departmentId: string,
  kioskCode: string
): Promise<KioskLookupResult> {
  if (!/^\d{4}$/.test(kioskCode)) {
    return { success: false, message: "4桁の数字を入力してください" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { kioskCode },
      select: { id: true, name: true, departmentId: true, isActive: true },
    });

    if (!user || user.departmentId !== departmentId || !user.isActive) {
      return { success: false, message: "該当するスタッフが見つかりません" };
    }

    const { start, end } = getDayRange(new Date());
    const attendance = await prisma.attendance.findFirst({
      where: { userId: user.id, clockIn: { gte: start, lte: end } },
      include: { breaks: true },
      orderBy: { clockIn: "desc" },
    });

    if (!attendance) {
      return {
        success: true,
        message: "",
        user: { id: user.id, name: user.name, status: "not_started", clockInTime: null },
      };
    }

    if (attendance.clockOut) {
      return {
        success: true,
        message: "",
        user: {
          id: user.id,
          name: user.name,
          status: "clocked_out",
          clockInTime: attendance.clockIn.toISOString(),
        },
      };
    }

    const activeBreak = attendance.breaks.find((b) => !b.breakEnd);
    return {
      success: true,
      message: "",
      user: {
        id: user.id,
        name: user.name,
        status: activeBreak ? "on_break" : "clocked_in",
        clockInTime: attendance.clockIn.toISOString(),
      },
    };
  } catch {
    return { success: false, message: "システムエラーが発生しました" };
  }
}

export async function kioskClockIn(
  userId: string,
  departmentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, isActive: true },
    });
    if (!user || user.departmentId !== departmentId || !user.isActive) {
      return { success: false, message: "無効なユーザーです" };
    }

    const { start, end } = getDayRange(new Date());
    const rule = await getResolvedWorkRule(userId);

    const existing = await prisma.attendance.findFirst({
      where: { userId, clockIn: { gte: start, lte: end } },
    });

    if (existing && !rule.allowMultipleClockIns) {
      return { success: false, message: "本日はすでに出勤打刻済みです" };
    }

    await prisma.attendance.create({
      data: { userId, clockIn: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/clock");
    return { success: true, message: "出勤打刻が完了しました" };
  } catch {
    return { success: false, message: "システムエラーが発生しました" };
  }
}

export async function kioskClockOut(
  userId: string,
  departmentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, isActive: true },
    });
    if (!user || user.departmentId !== departmentId || !user.isActive) {
      return { success: false, message: "無効なユーザーです" };
    }

    const { start, end } = getDayRange(new Date());
    const attendance = await prisma.attendance.findFirst({
      where: { userId, clockIn: { gte: start, lte: end }, clockOut: null },
      include: { breaks: true },
    });

    if (!attendance) {
      return { success: false, message: "出勤打刻がありません" };
    }

    const now = new Date();

    const activeBreak = attendance.breaks.find((b) => !b.breakEnd);
    if (activeBreak) {
      await prisma.break.update({
        where: { id: activeBreak.id },
        data: { breakEnd: now },
      });
    }

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: { clockOut: now },
    });

    revalidatePath("/dashboard");
    revalidatePath("/clock");
    return { success: true, message: "退勤打刻が完了しました" };
  } catch {
    return { success: false, message: "システムエラーが発生しました" };
  }
}
