"use client";

import { useActionState } from "react";
import { updateUserRole } from "@/actions/admin";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function UserActionsRow({ user }: { user: User }) {
  const [state, action, isPending] = useActionState(updateUserRole, {
    success: false,
    message: "",
  });

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <select
        name="role"
        defaultValue={user.role}
        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="EMPLOYEE">一般</option>
        <option value="ADMIN">管理者</option>
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
