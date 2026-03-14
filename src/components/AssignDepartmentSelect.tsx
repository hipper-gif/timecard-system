"use client";

import { useActionState } from "react";
import { assignDepartment } from "@/actions/department";

type Props = {
  userId: string;
  currentDepartmentId: string | null;
  departments: { id: string; name: string }[];
};

export default function AssignDepartmentSelect({
  userId,
  currentDepartmentId,
  departments,
}: Props) {
  const [state, action, isPending] = useActionState(assignDepartment, {
    success: false,
    message: "",
  });

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        key={currentDepartmentId ?? "none"}
        name="departmentId"
        defaultValue={currentDepartmentId ?? ""}
        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[120px]"
      >
        <option value="">未割り当て</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "..." : "変更"}
      </button>
      {state.message && (
        <span
          className={`text-xs ${state.success ? "text-green-600" : "text-red-600"}`}
        >
          {state.success ? "✓" : "✗"}
        </span>
      )}
    </form>
  );
}
