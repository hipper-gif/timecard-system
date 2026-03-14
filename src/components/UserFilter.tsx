"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  departments: { id: string; name: string }[];
};

export default function UserFilter({ departments }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDept = searchParams.get("dept") || "";
  const showInactive = searchParams.get("inactive") === "1";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={currentDept}
        onChange={(e) => updateParams("dept", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">全部署</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => updateParams("inactive", e.target.checked ? "1" : "")}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        無効ユーザーを表示
      </label>
    </div>
  );
}
