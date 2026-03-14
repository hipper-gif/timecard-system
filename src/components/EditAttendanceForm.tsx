"use client";

import { useActionState, useState } from "react";
import { updateAttendance, addBreak, updateBreak, deleteBreak } from "@/actions/admin";
import Link from "next/link";
import LocationDisplay from "@/components/LocationDisplay";

type Break = {
  id: string;
  breakStart: Date;
  breakEnd: Date | null;
  latitude: number | null;
  longitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
};

type Attendance = {
  id: string;
  clockIn: Date;
  clockOut: Date | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  note: string | null;
  user: { name: string };
  breaks: Break[];
};

function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditAttendanceForm({ attendance }: { attendance: Attendance }) {
  const [state, action, isPending] = useActionState(updateAttendance, {
    success: false,
    message: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/attendance"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 全員の勤怠
        </Link>
        <h1 className="text-xl font-bold text-gray-900">打刻編集</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
        <p className="text-sm text-gray-500 mb-4">
          対象: <span className="font-medium text-gray-800">{attendance.user.name}</span>
        </p>

        {state.message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
              state.success
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <input type="hidden" name="attendanceId" value={attendance.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              出勤時刻 <span className="text-red-500">*</span>
            </label>
            <input
              name="clockIn"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(new Date(attendance.clockIn))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(attendance.clockInLat != null || attendance.clockInLng != null) && (
              <div className="mt-1">
                <LocationDisplay latitude={attendance.clockInLat} longitude={attendance.clockInLng} label="出勤位置" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              退勤時刻 <span className="text-gray-400">（空欄で未退勤）</span>
            </label>
            <input
              name="clockOut"
              type="datetime-local"
              defaultValue={attendance.clockOut ? toDateTimeLocal(new Date(attendance.clockOut)) : ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(attendance.clockOutLat != null || attendance.clockOutLng != null) && (
              <div className="mt-1">
                <LocationDisplay latitude={attendance.clockOutLat} longitude={attendance.clockOutLng} label="退勤位置" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考 <span className="text-gray-400">（任意）</span>
            </label>
            <textarea
              name="note"
              placeholder="メモ（任意）"
              defaultValue={attendance.note || ""}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "更新中..." : "更新する"}
            </button>
            <Link
              href="/admin/attendance"
              className="flex-1 py-2.5 text-center bg-gray-100 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </form>

        {/* 休憩記録セクション */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">休憩記録</h3>

          {attendance.breaks.length > 0 ? (
            <div className="space-y-3 mb-4">
              {attendance.breaks.map((b) => (
                <BreakRow key={b.id} brk={b} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">休憩記録はありません</p>
          )}

          <AddBreakForm attendanceId={attendance.id} />
        </div>

        {state.success && (
          <div className="mt-4 text-center">
            <Link href="/admin/attendance" className="text-sm text-blue-600 hover:underline">
              全員の勤怠に戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// BreakRow: 個別休憩の編集・削除
// ============================================================

function BreakRow({ brk }: { brk: Break }) {
  const [updateState, updateAction, isUpdating] = useActionState(updateBreak, {
    success: false,
    message: "",
  });
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteBreak, {
    success: false,
    message: "",
  });

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {(updateState.message || deleteState.message) && (
        <div
          className={`mb-2 px-3 py-2 rounded text-xs border ${
            (updateState.success || deleteState.success)
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {updateState.message || deleteState.message}
        </div>
      )}

      <form action={updateAction} className="space-y-2">
        <input type="hidden" name="breakId" value={brk.id} />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-0.5">休憩開始</label>
            <input
              name="breakStart"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(new Date(brk.breakStart))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-0.5">休憩終了</label>
            <input
              name="breakEnd"
              type="datetime-local"
              defaultValue={brk.breakEnd ? toDateTimeLocal(new Date(brk.breakEnd)) : ""}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {(brk.latitude != null || brk.longitude != null) && (
          <div className="mt-1">
            <LocationDisplay latitude={brk.latitude} longitude={brk.longitude} label="休憩開始位置" />
          </div>
        )}
        {(brk.endLatitude != null || brk.endLongitude != null) && (
          <div className="mt-1">
            <LocationDisplay latitude={brk.endLatitude} longitude={brk.endLongitude} label="休憩終了位置" />
          </div>
        )}

        <div className="flex gap-2 items-center pt-1">
          <button
            type="submit"
            disabled={isUpdating}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isUpdating ? "更新中..." : "更新"}
          </button>
        </div>
      </form>

      <form action={deleteAction} className="mt-1">
        <input type="hidden" name="breakId" value={brk.id} />
        <button
          type="submit"
          disabled={isDeleting}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          onClick={(e) => {
            if (!confirm("この休憩記録を削除しますか？")) {
              e.preventDefault();
            }
          }}
        >
          {isDeleting ? "削除中..." : "削除"}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// AddBreakForm: 休憩の新規追加
// ============================================================

function AddBreakForm({ attendanceId }: { attendanceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, isPending] = useActionState(addBreak, {
    success: false,
    message: "",
  });

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        + 休憩を追加
      </button>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {state.message && (
        <div
          className={`mb-2 px-3 py-2 rounded text-xs border ${
            state.success
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-2">
        <input type="hidden" name="attendanceId" value={attendanceId} />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-0.5">休憩開始 <span className="text-red-500">*</span></label>
            <input
              name="breakStart"
              type="datetime-local"
              required
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-0.5">休憩終了</label>
            <input
              name="breakEnd"
              type="datetime-local"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "追加中..." : "追加"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
