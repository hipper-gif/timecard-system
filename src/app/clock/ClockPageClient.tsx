"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { clockIn, clockOut } from "@/actions/attendance";
import { breakStart, breakEnd } from "@/actions/break";
import type { AttendanceStatus } from "@/types";
import Link from "next/link";

type Props = {
  userName: string;
  status: AttendanceStatus;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number | null;
  breakCount: number;
  workingMinutes: number | null;
};

export default function ClockPageClient(props: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = currentTime.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const bgColor = {
    not_started: "bg-gray-50",
    clocked_in: "bg-green-50",
    on_break: "bg-orange-50",
    clocked_out: "bg-blue-50",
  }[props.status];

  const statusLabel = {
    not_started: "未出勤",
    clocked_in: "勤務中",
    on_break: "休憩中",
    clocked_out: "退勤済み",
  }[props.status];

  const statusColor = {
    not_started: "text-gray-500",
    clocked_in: "text-green-600",
    on_break: "text-orange-600",
    clocked_out: "text-blue-600",
  }[props.status];

  return (
    <div className={`min-h-screen ${bgColor} flex flex-col items-center justify-center p-4 transition-colors`}>
      {/* 現在時刻 */}
      <div className="text-center mb-8">
        <p className="text-6xl font-bold text-gray-900 tabular-nums tracking-tight">
          {timeStr}
        </p>
        <p className="text-sm text-gray-500 mt-2">{dateStr}</p>
      </div>

      {/* ステータス */}
      <div className="mb-8 text-center">
        <p className={`text-lg font-semibold ${statusColor}`}>{statusLabel}</p>
        <p className="text-xs text-gray-400 mt-1">{props.userName}</p>
      </div>

      {/* 打刻情報（コンパクト） */}
      <div className="flex items-center gap-6 mb-8 text-sm text-gray-600">
        {props.clockIn && (
          <span>出勤 {new Date(props.clockIn).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
        )}
        {props.clockOut && (
          <span>退勤 {new Date(props.clockOut).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
        )}
        {props.breakCount > 0 && (
          <span>休憩 {props.breakMinutes ?? 0}分</span>
        )}
      </div>

      {/* 打刻ボタン（大きく） */}
      <div className="w-full max-w-xs space-y-3">
        {props.status === "not_started" && (
          <ClockGeoButton action={clockIn} label="出勤" pendingLabel="打刻中..."
            className="w-full py-5 text-xl bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg" />
        )}
        {props.status === "clocked_in" && (
          <>
            <ClockGeoButton action={breakStart} label="休憩開始" pendingLabel="処理中..."
              className="w-full py-4 text-lg bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-lg" />
            <ClockGeoButton action={clockOut} label="退勤" pendingLabel="打刻中..."
              className="w-full py-5 text-xl bg-gray-700 text-white font-bold rounded-2xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg" />
          </>
        )}
        {props.status === "on_break" && (
          <ClockGeoButton action={breakEnd} label="休憩終了" pendingLabel="処理中..."
            className="w-full py-5 text-xl bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg" />
        )}
        {props.status === "clocked_out" && (
          <div className="text-center py-4">
            <p className="text-gray-500">本日の打刻は完了しています</p>
            {props.workingMinutes != null && (
              <p className="text-sm text-gray-400 mt-1">
                勤務時間: {Math.floor(props.workingMinutes / 60)}時間{props.workingMinutes % 60}分
              </p>
            )}
          </div>
        )}
      </div>

      {/* ダッシュボードリンク */}
      <Link href="/dashboard" className="mt-12 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        ダッシュボードを開く →
      </Link>
    </div>
  );
}

function ClockGeoButton({
  action,
  label,
  pendingLabel,
  className,
}: {
  action: (prevState: { success: boolean; message: string }, formData: FormData) => Promise<{ success: boolean; message: string }>;
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { success: false, message: "" });
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const geoAttemptedRef = useRef(false);
  const [geoLoading, setGeoLoading] = useState(false);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!geoAttemptedRef.current && navigator.geolocation) {
          e.preventDefault();
          geoAttemptedRef.current = true;
          setGeoLoading(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (latRef.current) latRef.current.value = String(pos.coords.latitude);
              if (lngRef.current) lngRef.current.value = String(pos.coords.longitude);
              setGeoLoading(false);
              e.target instanceof HTMLFormElement && e.target.requestSubmit();
            },
            () => {
              setGeoLoading(false);
              e.target instanceof HTMLFormElement && e.target.requestSubmit();
            },
            { timeout: 10000, enableHighAccuracy: true }
          );
        }
      }}
    >
      <input type="hidden" name="latitude" ref={latRef} />
      <input type="hidden" name="longitude" ref={lngRef} />
      <button type="submit" disabled={isPending || geoLoading} className={className}>
        {isPending || geoLoading ? pendingLabel : label}
      </button>
      {state.message && (
        <p className={`text-sm mt-2 text-center ${state.success ? "text-green-600" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
