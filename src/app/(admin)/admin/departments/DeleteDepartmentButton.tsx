"use client";

import { useActionState } from "react";
import { deleteDepartment } from "@/actions/department";

type Props = {
  departmentId: string;
  userCount: number;
};

export default function DeleteDepartmentButton({ departmentId, userCount }: Props) {
  const [state, action, isPending] = useActionState(deleteDepartment, {
    success: false,
    message: "",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (userCount > 0) {
      const ok = window.confirm(
        `この部署には ${userCount} 名のユーザーが所属しています。\n削除するとユーザーの部署が未割り当てになります。\n本当に削除しますか？`
      );
      if (!ok) {
        e.preventDefault();
        return;
      }
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="inline-flex items-center gap-1">
      <input type="hidden" name="departmentId" value={departmentId} />
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
