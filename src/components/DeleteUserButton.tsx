"use client";

import { useActionState, useRef } from "react";
import { deleteUser } from "@/actions/admin";

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [state, action, isPending] = useActionState(deleteUser, {
    success: false,
    message: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(e) => {
        if (!confirm("このユーザーを削除しますか？この操作は取り消せません。")) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-1"
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "削除中..." : "削除"}
      </button>
      {state.message && !state.success && (
        <span className="text-xs text-red-600 ml-1">{state.message}</span>
      )}
    </form>
  );
}
