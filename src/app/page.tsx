import { redirect } from "next/navigation";
import { getSession } from "@/lib/cached-auth";

export default async function RootPage() {
  const session = await getSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
