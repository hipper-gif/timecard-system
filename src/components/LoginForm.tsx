"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-1">
          社員番号
        </label>
        <input
          id="employeeNumber"
          name="employeeNumber"
          type="text"
          required
          autoComplete="username"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="例: nikoniko"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
