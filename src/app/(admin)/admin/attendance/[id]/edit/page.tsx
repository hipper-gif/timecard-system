import { getSession } from "@/lib/cached-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EditAttendanceForm from "@/components/EditAttendanceForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAttendancePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;

  const attendance = await prisma.attendance.findUnique({
    where: { id },
    select: {
      id: true,
      clockIn: true,
      clockOut: true,
      clockInLat: true,
      clockInLng: true,
      clockOutLat: true,
      clockOutLng: true,
      note: true,
      user: { select: { name: true } },
      breaks: {
        select: { id: true, breakStart: true, breakEnd: true, latitude: true, longitude: true, endLatitude: true, endLongitude: true },
        orderBy: { breakStart: "asc" as const },
      },
    },
  });

  if (!attendance) notFound();

  return <EditAttendanceForm attendance={attendance} />;
}
