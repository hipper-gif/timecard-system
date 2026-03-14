import { getDepartmentName } from "@/actions/kiosk";
import { notFound } from "next/navigation";
import KioskClient from "./KioskClient";

type Props = {
  params: Promise<{ departmentId: string }>;
};

export default async function KioskDepartmentPage({ params }: Props) {
  const { departmentId } = await params;
  const departmentName = await getDepartmentName(departmentId);

  if (!departmentName) {
    notFound();
  }

  return <KioskClient departmentId={departmentId} departmentName={departmentName} />;
}
