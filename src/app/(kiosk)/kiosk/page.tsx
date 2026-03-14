import { getKioskDepartments } from "@/actions/kiosk";
import Image from "next/image";
import Link from "next/link";

export default async function KioskPage() {
  const departments = await getKioskDepartments();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center mb-10">
        <Image src="/logo.png" alt="SmartClock" width={240} height={70} priority />
        <p className="text-gray-500 mt-3">部署を選択してください</p>
      </div>

      {departments.length === 0 ? (
        <p className="text-gray-400">部署が登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/kiosk/${dept.id}`}
              className="block px-6 py-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-center"
            >
              <span className="text-xl font-semibold text-gray-900">{dept.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
