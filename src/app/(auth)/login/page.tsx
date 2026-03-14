import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/cached-auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="SmartClock" width={220} height={64} priority />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
