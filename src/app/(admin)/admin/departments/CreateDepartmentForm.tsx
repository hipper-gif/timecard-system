"use client";

import { useActionState } from "react";
import { createDepartment } from "@/actions/department";

export default function CreateDepartmentForm() {
  const [state, action, isPending] = useActionState(createDepartment, {
    success: false,
    message: "",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">部署を追加</h2>

      {state.message && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-xs ${
            state.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={action} className="flex items-center gap-3">
        <input
          name="name"
          type="text"
          placeholder="部署名"
          required
          maxLength={100}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? "追加中..." : "追加"}
        </button>
      </form>
    </div>
  );
}
