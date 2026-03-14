import { getSession } from "@/lib/cached-auth";
import { redirect } from "next/navigation";
import { getTodayAttendance } from "@/actions/attendance";
import ClockPageClient from "./ClockPageClient";

export default async function ClockPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const todayData = await getTodayAttendance();

  return (
    <ClockPageClient
      userName={session.user?.name ?? ""}
      status={todayData.status}
      clockIn={todayData.attendance?.clockIn ? todayData.attendance.clockIn.toISOString() : null}
      clockOut={todayData.attendance?.clockOut ? todayData.attendance.clockOut.toISOString() : null}
      breakMinutes={todayData.breakMinutes}
      breakCount={todayData.breakCount}
      workingMinutes={todayData.workingMinutes}
    />
  );
}
