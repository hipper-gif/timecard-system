"use client";

import { useActionState, useRef, useState } from "react";
import { clockIn, clockOut } from "@/actions/attendance";
import { breakStart, breakEnd } from "@/actions/break";
import type { AttendanceStatus } from "@/types";

type Props = { status: AttendanceStatus };

const initialState = { success: false, message: "" };

function GeoForm({
  action,
  disabled,
  label,
  pendingLabel,
  className,
  geoLoading,
  setGeoLoading,
}: {
  action: (prevState: { success: boolean; message: string }, formData: FormData) => Promise<{ success: boolean; message: string }>;
  disabled: boolean;
  label: string;
  pendingLabel: string;
  className: string;
  geoLoading: boolean;
  setGeoLoading: (v: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const geoAttemptedRef = useRef(false);

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
      <button
        type="submit"
        disabled={disabled || isPending || geoLoading}
        className={className}
      >
        {isPending || geoLoading ? pendingLabel : label}
      </button>
      {state.message && !state.success && (
        <p className="text-xs text-red-600 mt-1 text-center">{state.message}</p>
      )}
      {state.message && state.success && (
        <p className="text-xs text-green-600 mt-1 text-center">{state.message}</p>
      )}
    </form>
  );
}

export default function ClockButton({ status }: Props) {
  const [geoLoading, setGeoLoading] = useState(false);

  if (status === "clocked_out") {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">本日の打刻は完了しています</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 flex-wrap justify-center">
        {/* 出勤 */}
        <GeoForm
          action={clockIn}
          disabled={status !== "not_started"}
          label="出勤"
          pendingLabel="打刻中..."
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          geoLoading={geoLoading}
          setGeoLoading={setGeoLoading}
        />

        {/* 休憩開始 */}
        <GeoForm
          action={breakStart}
          disabled={status !== "clocked_in"}
          label="休憩開始"
          pendingLabel="処理中..."
          className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          geoLoading={geoLoading}
          setGeoLoading={setGeoLoading}
        />

        {/* 休憩終了 */}
        <GeoForm
          action={breakEnd}
          disabled={status !== "on_break"}
          label="休憩終了"
          pendingLabel="処理中..."
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          geoLoading={geoLoading}
          setGeoLoading={setGeoLoading}
        />

        {/* 退勤 */}
        <GeoForm
          action={clockOut}
          disabled={status !== "clocked_in"}
          label="退勤"
          pendingLabel="打刻中..."
          className="px-8 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          geoLoading={geoLoading}
          setGeoLoading={setGeoLoading}
        />
      </div>

      {geoLoading && (
        <p className="text-xs text-gray-400">位置情報を取得中...</p>
      )}
    </div>
  );
}
