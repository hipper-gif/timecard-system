"use client";

import { useActionState } from "react";
import { toggleUserStatus } from "@/actions/admin";

export default function StatusToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [state, action, isPending] = useActionState(toggleUserStatus, { success: false, message: "" });

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={isPending}
        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
          isActive
            ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
            : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        {isPending ? "..." : isActive ? "有効" : "無効"}
      </button>
    </form>
  );
}
