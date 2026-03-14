/**
 * MAIDO SYSTEM → SmartClock 勤怠データ移行スクリプト
 *
 * 使い方: npx tsx src/lib/migrate-maido.ts
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

// ============================================================
// DB接続
// ============================================================
const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

// ============================================================
// MAIDO設定
// ============================================================
const MAIDO_BASE = "https://maido-system.jp";
const MAIDO_SHOP_ID = "3660";
const MAIDO_LOGIN_ID = "nikoniko173";
const MAIDO_PASSWORD = "2525173";
const SHOP_IDS = ["3661"]; // Smiley のみ（必要なら "7182" も追加）

// 移行期間
const START_YEAR = 2024;
const START_MONTH = 1;
const END_YEAR = 2026;
const END_MONTH = 3;

// ============================================================
// Cookie管理
// ============================================================
let sessionCookie = "";

async function fetchWithCookie(
  url: string,
  options: RequestInit & { followRedirect?: boolean } = {}
): Promise<Response> {
  const { followRedirect = true, ...fetchOpts } = options;
  const headers: Record<string, string> = {
    Cookie: sessionCookie,
    ...(fetchOpts.headers as Record<string, string>),
  };
  const res = await fetch(url, {
    ...fetchOpts,
    headers,
    redirect: followRedirect ? "follow" : "manual",
  });
  // Set-Cookieを更新
  const setCookie = res.headers.getSetCookie?.();
  if (setCookie) {
    for (const c of setCookie) {
      const match = c.match(/PHPSESSID=([^;]+)/);
      if (match) sessionCookie = `PHPSESSID=${match[1]}`;
    }
  }
  return res;
}

// ============================================================
// ログイン
// ============================================================
async function login(): Promise<void> {
  // まずセッションCookieを取得
  const loginPage = await fetch(`${MAIDO_BASE}/users/login`);
  const setCookie = loginPage.headers.getSetCookie?.();
  if (setCookie) {
    for (const c of setCookie) {
      const match = c.match(/PHPSESSID=([^;]+)/);
      if (match) sessionCookie = `PHPSESSID=${match[1]}`;
    }
  }

  // ログイン
  const body = new URLSearchParams({
    _method: "POST",
    "data[User][shop_id]": MAIDO_SHOP_ID,
    "data[User][login_id]": MAIDO_LOGIN_ID,
    "data[User][password]": MAIDO_PASSWORD,
  });

  const res = await fetchWithCookie(`${MAIDO_BASE}/users/login`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    followRedirect: false,
  });

  if (res.status === 302) {
    console.log("MAIDO ログイン成功");
  } else {
    throw new Error(`MAIDO ログイン失敗: ${res.status}`);
  }
}

// ============================================================
// スタッフ一覧取得
// ============================================================
type MaidoStaff = { maidoId: string; name: string };

async function getStaffList(shopId: string): Promise<MaidoStaff[]> {
  const allStaff: MaidoStaff[] = [];

  for (const status of ["1", "0"]) {
    // 有効(1)と無効(0)両方
    let page = 1;
    while (true) {
      // page=1は検索フォーム、page>=2はlist_form
      const postUrl =
        page === 1
          ? `${MAIDO_BASE}/users/index`
          : `${MAIDO_BASE}/users/index/${shopId}`;

      const params: Record<string, string> =
        page === 1
          ? {
              _method: "POST",
              "data[User][shop_id]": shopId,
              "data[User][status]": status,
              "data[User][limit]": "100",
              "data[User][name_sei]": "",
              "data[User][name_mei]": "",
            }
          : {
              _method: "POST",
              "data[User][sort]": "",
              "data[User][status]": status,
              "data[User][name_sei]": "",
              "data[User][name_mei]": "",
              "data[User][page]": String(page),
              "data[User][limit]": "100",
            };

      const body = new URLSearchParams(params);
      const res = await fetchWithCookie(postUrl, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const html = await res.text();

      const re = new RegExp("print_view\\/(\\d+).*?>\\s*([^<]+?)\\s*<\\/a>", "gs");
      let m;
      let newCount = 0;
      while ((m = re.exec(html)) !== null) {
        const maidoId = m[1];
        const name = m[2].replace(/\s+/g, "");
        if (!allStaff.find((s) => s.maidoId === maidoId)) {
          allStaff.push({ maidoId, name });
          newCount++;
        }
      }

      console.log(`  status=${status} page=${page}: 新規${newCount}件 (累計${allStaff.length})`);
      if (newCount === 0) break;
      page++;
    }
  }

  return allStaff;
}

// ============================================================
// タイムカード取得
// ============================================================
type TimecardRecord = {
  date: string; // YYYY-MM-DD
  clockIn: string | null; // HH:MM
  clockOut: string | null; // HH:MM
  breakHours: number;
};

async function getTimecards(
  maidoId: string,
  year: number,
  month: number
): Promise<TimecardRecord[]> {
  const m = String(month).padStart(2, "0");
  const res = await fetchWithCookie(
    `${MAIDO_BASE}/timecards/view/${maidoId}/?from_y=${year}&from_m=${m}`
  );
  const html = await res.text();

  const records: TimecardRecord[] = [];

  // 行を分割して解析
  // パターン: 日付行 → 出勤時刻 → 退勤時刻 → ... → 休憩時間
  const rowRegex =
    /(\d+)\/(\d+)&nbsp;\([^)]+\)[\s\S]*?<td class="gu_c">\s*<span class="blue_b">\s*([\d:]*)\s*<\/span>[\s\S]*?<td class="gu_c">\s*<span class="blue_b">\s*([\d:]*)\s*<\/span>[\s\S]*?休憩[\s\S]*?<span[^>]*>\s*([\d.]+)\s*h/g;

  // もっとシンプルなアプローチ: 行ごとにパース
  const trBlocks = html.split("<tr>").slice(1);

  for (const block of trBlocks) {
    // 日付を探す
    const dateMatch = block.match(/(\d+)\/(\d+)&nbsp;\(([^)]+)\)/);
    if (!dateMatch) continue;

    const dayMonth = parseInt(dateMatch[1]);
    const dayDate = parseInt(dateMatch[2]);

    // 出勤・退勤時刻（blue_bスパン内）
    const timeMatches = [
      ...block.matchAll(
        /<span class="blue_b">\s*(\d{1,2}:\d{2})?\s*<\/span>/g
      ),
    ];
    const clockIn = timeMatches[0]?.[1] || null;
    const clockOut = timeMatches[1]?.[1] || null;

    if (!clockIn && !clockOut) continue; // 打刻がない日はスキップ

    // 休憩時間（休憩列: タイムカード打刻分）
    const breakMatch = block.match(
      /bold_100p.*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<span[^>]*>\s*([\d.]+)\s*h/
    );
    const breakHours = breakMatch ? parseFloat(breakMatch[1]) : 0;

    // 年を決定（month をベースに）
    let actualYear = year;
    // 表示月とdayMonthが一致しない場合の年跨ぎ対応
    if (dayMonth === 12 && month === 1) actualYear = year - 1;
    if (dayMonth === 1 && month === 12) actualYear = year + 1;

    const dateStr = `${actualYear}-${String(dayMonth).padStart(2, "0")}-${String(dayDate).padStart(2, "0")}`;

    records.push({ date: dateStr, clockIn, clockOut, breakHours });
  }

  return records;
}

// ============================================================
// メイン処理
// ============================================================
async function main() {
  console.log("=== MAIDO SYSTEM → SmartClock 勤怠データ移行 ===\n");

  // ログイン
  await login();

  // SmartClockの全ユーザーを取得
  const scUsers = await prisma.user.findMany({
    select: { id: true, employeeNumber: true, name: true },
  });
  console.log(`SmartClock ユーザー数: ${scUsers.length}`);

  // 名前→ユーザーのマップ（重複名対応のため配列）
  const nameMap = new Map<string, (typeof scUsers)[number][]>();
  for (const u of scUsers) {
    const arr = nameMap.get(u.name) || [];
    arr.push(u);
    nameMap.set(u.name, arr);
  }

  let totalImported = 0;
  let totalSkipped = 0;
  const unmatchedStaff: string[] = [];

  for (const shopId of SHOP_IDS) {
    console.log(`\n--- 店舗 ${shopId} のスタッフ一覧取得中... ---`);
    const staffList = await getStaffList(shopId);
    console.log(`スタッフ数: ${staffList.length}`);

    for (const staff of staffList) {
      // SmartClockユーザーとマッチング
      const candidates = nameMap.get(staff.name);
      if (!candidates || candidates.length === 0) {
        unmatchedStaff.push(`${staff.maidoId}: ${staff.name}`);
        continue;
      }
      const scUser = candidates[0]; // 最初のマッチを使用

      console.log(
        `\n[${staff.name}] MAIDO ID:${staff.maidoId} → SC:${scUser.employeeNumber}`
      );

      let staffImported = 0;

      // 月ごとにタイムカード取得
      for (
        let y = START_YEAR, m = START_MONTH;
        y < END_YEAR || (y === END_YEAR && m <= END_MONTH);
        m++
      ) {
        if (m > 12) {
          m = 1;
          y++;
        }

        const records = await getTimecards(staff.maidoId, y, m);
        if (records.length === 0) continue;

        for (const rec of records) {
          if (!rec.clockIn) continue;

          const [ciH, ciM] = rec.clockIn.split(":").map(Number);
          const clockIn = new Date(`${rec.date}T${String(ciH).padStart(2, "0")}:${String(ciM).padStart(2, "0")}:00+09:00`);

          let clockOut: Date | null = null;
          if (rec.clockOut) {
            const [coH, coM] = rec.clockOut.split(":").map(Number);
            // 退勤が出勤より早い場合は翌日
            let outDate = rec.date;
            if (coH < ciH || (coH === ciH && coM < ciM)) {
              const d = new Date(rec.date);
              d.setDate(d.getDate() + 1);
              outDate = d.toISOString().split("T")[0];
            }
            clockOut = new Date(`${outDate}T${String(coH).padStart(2, "0")}:${String(coM).padStart(2, "0")}:00+09:00`);
          }

          // 重複チェック（同じユーザー・同じ出勤時刻）
          const existing = await prisma.attendance.findFirst({
            where: {
              userId: scUser.id,
              clockIn: clockIn,
            },
          });

          if (existing) {
            totalSkipped++;
            continue;
          }

          // 登録
          const attendance = await prisma.attendance.create({
            data: {
              userId: scUser.id,
              clockIn,
              clockOut,
              note: "MAIDO移行",
            },
          });

          // 休憩がある場合は登録
          if (rec.breakHours > 0 && clockIn && clockOut) {
            const breakMinutes = Math.round(rec.breakHours * 60);
            // 出勤から4時間後に休憩開始と仮定
            const breakStart = new Date(clockIn.getTime() + 4 * 60 * 60 * 1000);
            const breakEnd = new Date(
              breakStart.getTime() + breakMinutes * 60 * 1000
            );
            await prisma.break.create({
              data: {
                attendanceId: attendance.id,
                breakStart,
                breakEnd,
              },
            });
          }

          staffImported++;
          totalImported++;
        }

        // レート制限対策
        await new Promise((r) => setTimeout(r, 200));
      }

      console.log(`  → ${staffImported}件インポート`);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`インポート: ${totalImported}件`);
  console.log(`スキップ（重複）: ${totalSkipped}件`);

  if (unmatchedStaff.length > 0) {
    console.log(`\nマッチしなかったスタッフ (${unmatchedStaff.length}名):`);
    unmatchedStaff.forEach((s) => console.log(`  ${s}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
