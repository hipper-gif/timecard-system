"use client";

import { useActionState, useState } from "react";

type BreakTier = { thresholdHours: number; breakMinutes: number };

type Props = {
  action: (prevState: { success: boolean; message: string }, formData: FormData) => Promise<{ success: boolean; message: string }>;
  defaultValues?: {
    workStartTime?: string;
    workEndTime?: string;
    defaultBreakMinutes?: number;
    breakTiers?: BreakTier[];
    allowMultipleClockIns?: boolean;
    roundingUnit?: number;
    clockInRounding?: string;
    clockOutRounding?: string;
  };
  hiddenFields?: Record<string, string>;
  deleteAction?: (prevState: { success: boolean; message: string }, formData: FormData) => Promise<{ success: boolean; message: string }>;
  deleteRuleId?: string;
};

const initialState = { success: false, message: "" };

export default function WorkRuleForm({
  action,
  defaultValues,
  hiddenFields,
  deleteAction,
  deleteRuleId,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteAction ?? (async () => initialState),
    initialState
  );
  const [tiers, setTiers] = useState<BreakTier[]>(
    defaultValues?.breakTiers ?? []
  );

  const message = state.message || deleteState.message;
  const isSuccess = state.success || deleteState.success;

  const addTier = () => {
    setTiers([...tiers, { thresholdHours: 6, breakMinutes: 45 }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof BreakTier, value: number) => {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  return (
    <div>
      {message && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-sm border ${
            isSuccess
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        {hiddenFields &&
          Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        <input type="hidden" name="breakTiers" value={JSON.stringify(tiers)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">始業時間</label>
            <input
              name="workStartTime"
              type="time"
              required
              defaultValue={defaultValues?.workStartTime ?? "09:00"}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">終業時間</label>
            <input
              name="workEndTime"
              type="time"
              required
              defaultValue={defaultValues?.workEndTime ?? "18:00"}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">デフォルト休憩時間（分）</label>
          <input
            name="defaultBreakMinutes"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.defaultBreakMinutes ?? 60}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">段階ルールに該当しない場合に適用されます</p>
        </div>

        {/* 段階的休憩ルール */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">段階的休憩ルール（任意）</label>
          {tiers.length > 0 && (
            <div className="space-y-2 mb-2">
              {tiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    value={tier.thresholdHours}
                    onChange={(e) => updateTier(i, "thresholdHours", parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <span className="text-gray-500 text-xs">時間以上 →</span>
                  <input
                    type="number"
                    min={0}
                    value={tier.breakMinutes}
                    onChange={(e) => updateTier(i, "breakMinutes", parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <span className="text-gray-500 text-xs">分休憩</span>
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addTier}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            ＋ ルール追加
          </button>
        </div>

        {/* 集計時刻単位（丸め設定） */}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">集計時刻単位（丸め設定）</label>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">丸め単位</label>
              <select
                name="roundingUnit"
                defaultValue={defaultValues?.roundingUnit ?? 1}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1分（丸めなし）</option>
                <option value="5">5分</option>
                <option value="10">10分</option>
                <option value="15">15分</option>
                <option value="30">30分</option>
                <option value="60">60分</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">出勤時刻</label>
                <select
                  name="clockInRounding"
                  defaultValue={defaultValues?.clockInRounding ?? "none"}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">丸めなし</option>
                  <option value="ceil">切り上げ</option>
                  <option value="floor">切り捨て</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">退勤時刻</label>
                <select
                  name="clockOutRounding"
                  defaultValue={defaultValues?.clockOutRounding ?? "none"}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">丸めなし</option>
                  <option value="ceil">切り上げ</option>
                  <option value="floor">切り捨て</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
              ※ 労基法上、出勤の切り上げ・退勤の切り捨ては労働者不利となり違法の可能性があります。1分単位での管理を推奨します。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            name="allowMultipleClockIns"
            type="checkbox"
            id={`allowMultiple-${hiddenFields?.departmentId ?? hiddenFields?.userId ?? "system"}`}
            defaultChecked={defaultValues?.allowMultipleClockIns ?? false}
            className="rounded border-gray-300"
          />
          <label
            htmlFor={`allowMultiple-${hiddenFields?.departmentId ?? hiddenFields?.userId ?? "system"}`}
            className="text-xs text-gray-700"
          >
            1日に複数回の出勤を許可
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
      </form>

      {deleteAction && deleteRuleId && (
        <form action={deleteFormAction} className="mt-2">
          <input type="hidden" name="ruleId" value={deleteRuleId} />
          <button
            type="submit"
            disabled={isDeletePending}
            className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg text-sm hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {isDeletePending ? "削除中..." : "削除"}
          </button>
        </form>
      )}
    </div>
  );
}
