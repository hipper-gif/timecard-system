"use client";

import { useActionState } from "react";
import { updateUser } from "@/actions/admin";
import Link from "next/link";

type Props = {
  user: {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
  };
};

export default function EditUserForm({ user }: Props) {
  const [state, action, isPending] = useActionState(updateUser, {
    success: false,
    message: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← ユーザー管理
        </Link>
        <h1 className="text-xl font-bold text-gray-900">ユーザー編集</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
        {state.message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              state.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              社員番号
            </label>
            <p className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">{user.employeeNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={user.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "更新中..." : "更新"}
          </button>
        </form>

        {state.success && (
          <div className="mt-4 text-center">
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:underline"
            >
              ユーザー管理に戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
