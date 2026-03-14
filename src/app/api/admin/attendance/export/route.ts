import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateBreakMinutes, getRoundedTimes, RoundingRule } from "@/lib/time-utils";
import { getResolvedWorkRule } from "@/actions/workrule";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const departmentId = url.searchParams.get("departmentId") || undefined;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const attendances = await prisma.attendance.findMany({
    where: {
      clockIn: { gte: start, lte: end },
      ...(departmentId ? { user: { departmentId } } : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          department: { select: { name: true } },
        },
      },
      breaks: { orderBy: { breakStart: "asc" } },
    },
    orderBy: [{ user: { name: "asc" } }, { clockIn: "asc" }],
  });

  // ユーザー別の丸めルールを取得
  const userIds = [...new Set(attendances.map(a => a.userId))];
  const ruleEntries = await Promise.all(
    userIds.map(async (uid) => [uid, await getResolvedWorkRule(uid)] as const)
  );
  const userRules = Object.fromEntries(ruleEntries);

  // CSV生成
  const header = [
    "名前", "メールアドレス", "部署", "日付",
    "出勤時刻（生）", "退勤時刻（生）",
    "出勤時刻（丸め後）", "退勤時刻（丸め後）",
    "休憩時間（分）", "拘束時間（分）", "実働時間（分）",
    "出勤緯度", "出勤経度", "退勤緯度", "退勤経度",
  ];
  const rows = attendances.map((a) => {
    const breaks = a.breaks ?? [];
    const breakMins = calculateBreakMinutes(breaks);
    const rule = userRules[a.userId];
    const rounding: RoundingRule = {
      roundingUnit: rule?.roundingUnit ?? 1,
      clockInRounding: (rule?.clockInRounding ?? "none") as "none" | "ceil" | "floor",
      clockOutRounding: (rule?.clockOutRounding ?? "none") as "none" | "ceil" | "floor",
    };
    const { roundedClockIn, roundedClockOut } = getRoundedTimes(a.clockIn, a.clockOut, rounding);
    const grossMins = roundedClockOut
      ? Math.floor((roundedClockOut.getTime() - roundedClockIn.getTime()) / 60000)
      : null;
    const netMins = grossMins != null ? Math.max(0, grossMins - breakMins) : null;

    const fmtTime = (d: Date) => d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

    return [
      a.user.name,
      a.user.email,
      a.user.department?.name ?? "",
      a.clockIn.toLocaleDateString("ja-JP"),
      fmtTime(a.clockIn),
      a.clockOut ? fmtTime(a.clockOut) : "",
      fmtTime(roundedClockIn),
      roundedClockOut ? fmtTime(roundedClockOut) : "",
      String(breakMins),
      grossMins != null ? String(grossMins) : "",
      netMins != null ? String(netMins) : "",
      a.clockInLat != null ? String(a.clockInLat) : "",
      a.clockInLng != null ? String(a.clockInLng) : "",
      a.clockOutLat != null ? String(a.clockOutLat) : "",
      a.clockOutLng != null ? String(a.clockOutLng) : "",
    ];
  });

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const filename = `attendance_${year}_${String(month).padStart(2, "0")}.csv`;

  return new Response("\uFEFF" + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
