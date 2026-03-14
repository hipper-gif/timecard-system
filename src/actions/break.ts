"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function breakStart(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "認証が必要です" };

  const { start, end } = getDayRange(new Date());

  try {
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        clockIn: { gte: start, lte: end },
        clockOut: null,
      },
      include: { breaks: true },
    });

    if (!attendance) {
      return { success: false, message: "出勤中の記録がありません" };
    }

    const activeBreak = attendance.breaks.find((b) => !b.breakEnd);
    if (activeBreak) {
      return { success: false, message: "すでに休憩中です" };
    }

    const lat = formData.get("latitude");
    const lng = formData.get("longitude");

    await prisma.break.create({
      data: {
        attendanceId: attendance.id,
        breakStart: new Date(),
        latitude: lat ? parseFloat(lat as string) : null,
        longitude: lng ? parseFloat(lng as string) : null,
      },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/clock");
  return { success: true, message: "休憩を開始しました" };
}

export async function breakEnd(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "認証が必要です" };

  const { start, end } = getDayRange(new Date());

  try {
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        clockIn: { gte: start, lte: end },
        clockOut: null,
      },
      include: { breaks: true },
    });

    if (!attendance) {
      return { success: false, message: "出勤中の記録がありません" };
    }

    const activeBreak = attendance.breaks.find((b) => !b.breakEnd);
    if (!activeBreak) {
      return { success: false, message: "休憩中ではありません" };
    }

    const lat = formData.get("latitude");
    const lng = formData.get("longitude");

    await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        breakEnd: new Date(),
        endLatitude: lat ? parseFloat(lat as string) : null,
        endLongitude: lng ? parseFloat(lng as string) : null,
      },
    });
  } catch {
    return { success: false, message: "データベース接続エラーが発生しました" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/clock");
  return { success: true, message: "休憩を終了しました" };
}
