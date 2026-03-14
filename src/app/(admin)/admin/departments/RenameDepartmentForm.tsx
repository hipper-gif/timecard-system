"use client";

import { useActionState, useState } from "react";
import { renameDepartment } from "@/actions/department";

type Props = {
  departmentId: string;
  currentName: string;
};

export default function RenameDepartmentForm({ departmentId, currentName }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, action, isPending] = useActionState(renameDepartment, {
    success: false,
    message: "",
  });

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
        title="クリックして編集"
      >
        {currentName}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="departmentId" value={departmentId} />
      <input
        type="text"
        name="name"
        defaultValue={currentName}
        autoFocus
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "..." : "保存"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-gray-400 hover:underline"
      >
        取消
      </button>
      {state.message && !state.success && (
        <span className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  );
}
