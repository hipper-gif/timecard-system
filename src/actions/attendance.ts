"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/cached-auth";
import { revalidatePath } from "next/cache";
import { calculateBreakMinutes, calculateWorkingMinutes } from "@/lib/time-utils";
import { getResolvedWorkRule } from "@/actions/workrule";
import type { TodayAttendance, AttendanceRecord, WorkRuleResolved } from "@/types";
import type { RoundingRule } from "@/lib/time-utils";

function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("認証が必要です");
  return session.user.id;
}

export async function getTodayAttendance(): Promise<TodayAttendance> {
  const userId = await requireAuth();

  try {
    const { start, end } = getDayRange(new Date());

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        clockIn: { gte: start, lte: end },
      },
      include: { breaks: { orderBy: { breakStart: "asc" } } },
      orderBy: { clockIn: "desc" },
    });

    if (!attendance) {
      return { status: "not_started", attendance: null, workingMinutes: null, breakMinutes: null, breakCount: 0 };
    }

    const breaks = attendance.breaks;
    const breakMinutes = calculateBreakMinutes(breaks);
    const breakCount = breaks.length;
    const activeBreak = breaks.find((b) => !b.breakEnd);

    if (!attendance.clockOut) {
      const status = activeBreak ? "on_break" as const : "clocked_in" as const;
      return { status, attendance, workingMinutes: null, breakMinutes, breakCount };
    }

    const workingMinutes = calculateWorkingMinutes(attendance.clockIn, attendance.clockOut, breaks);

    return { status: "clocked_out", attendance, workingMinutes, breakMinutes, breakCount };
  } catch {
    return { status: "not_started", attendance: null, workingMinutes: null, breakMinutes: null, breakCount: 0 };
  }
}

export async function clockIn(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "認証が必要です" };

  try {
    const { start, end } = getDayRange(new Date());

    const rule = await getResolvedWorkRule(session.user.id);

    const existing = await prisma.attendance.findFirst({
      where: { userId: session.user.id, clockIn: { gte: start, lte: end } },
    });

    if (existing && !rule.allowMultipleClockIns) {
      return { success: false, message: "本日はすでに出勤打刻済みです" };
    }

    const lat = formData.get("latitude");
    const lng = formData.get("longitude");

    await prisma.attendance.create({
      data: {
        userId: session.user.id,
        clockIn: new Date(),
        clockInLat: lat ? parseFloat(lat as string) : null,
        clockInLng: lng ? parseFloat(lng as string) : null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/clock");
    return { success: true, message: "出勤打刻が完了しました" };
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました。しばらく待ってから再試行してください。" };
  }
}

export async function clockOut(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "認証が必要です" };

  try {
    const { start, end } = getDayRange(new Date());

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        clockIn: { gte: start, lte: end },
        clockOut: null,
      },
      include: { breaks: true },
    });

    if (!attendance) {
      return { success: false, message: "出勤打刻がありません" };
    }

    const now = new Date();
    const lat = formData.get("latitude");
    const lng = formData.get("longitude");

    // 未終了の休憩を自動終了
    const activeBreak = attendance.breaks.find((b) => !b.breakEnd);
    if (activeBreak) {
      await prisma.break.update({
        where: { id: activeBreak.id },
        data: { breakEnd: now },
      });
    }

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        clockOutLat: lat ? parseFloat(lat as string) : null,
        clockOutLng: lng ? parseFloat(lng as string) : null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/clock");
    return { success: true, message: "退勤打刻が完了しました" };
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました。しばらく待ってから再試行してください。" };
  }
}

export async function getMonthlyAttendances(
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  const userId = await requireAuth();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    return await prisma.attendance.findMany({
      where: { userId, clockIn: { gte: start, lte: end } },
      include: { breaks: { orderBy: { breakStart: "asc" } } },
      orderBy: { clockIn: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getMonthlyAttendancesWithRounding(
  year: number,
  month: number
): Promise<{ records: AttendanceRecord[]; rounding: RoundingRule }> {
  const userId = await requireAuth();
  const rule = await getResolvedWorkRule(userId);
  const rounding: RoundingRule = {
    roundingUnit: rule.roundingUnit,
    clockInRounding: rule.clockInRounding,
    clockOutRounding: rule.clockOutRounding,
  };

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    const records = await prisma.attendance.findMany({
      where: { userId, clockIn: { gte: start, lte: end } },
      include: { breaks: { orderBy: { breakStart: "asc" } } },
      orderBy: { clockIn: "desc" },
    });
    return { records, rounding };
  } catch {
    return { records: [], rounding };
  }
}
