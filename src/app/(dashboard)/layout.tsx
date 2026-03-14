import { getSession } from "@/lib/cached-auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const userRole = (session.user as { role?: string }).role;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user?.name ?? ""} userRole={userRole} />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
