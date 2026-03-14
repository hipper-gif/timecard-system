/**
 * MAIDO SYSTEM → SmartClock 勤怠データ移行（並列版）
 *
 * 使い方: npx tsx src/lib/migrate-maido-parallel.ts
 *
 * 10ワーカーで並列にMAIDOからデータ取得・インポート
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

// ============================================================
// DB接続
// ============================================================
const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

// ============================================================
// 設定
// ============================================================
const MAIDO_BASE = "https://maido-system.jp";
const MAIDO_SHOP_ID = "3660";
const MAIDO_LOGIN_ID = "nikoniko173";
const MAIDO_PASSWORD = "2525173";
const SHOP_IDS = ["3661"];
const NUM_WORKERS = 10;
const START_YEAR = 2024;
const START_MONTH = 1;
const END_YEAR = 2026;
const END_MONTH = 3;

// ============================================================
// ワーカー: 独立したMAIDOセッション
// ============================================================
class MaidoWorker {
  id: number;
  sessionCookie = "";

  constructor(id: number) {
    this.id = id;
  }

  private async fetchWithCookie(
    url: string,
    options: RequestInit & { followRedirect?: boolean } = {}
  ): Promise<Response> {
    const { followRedirect = true, ...fetchOpts } = options;
    const headers: Record<string, string> = {
      Cookie: this.sessionCookie,
      ...(fetchOpts.headers as Record<string, string>),
    };
    const res = await fetch(url, {
      ...fetchOpts,
      headers,
      redirect: followRedirect ? "follow" : "manual",
    });
    const setCookie = res.headers.getSetCookie?.();
    if (setCookie) {
      for (const c of setCookie) {
        const match = c.match(/PHPSESSID=([^;]+)/);
        if (match) this.sessionCookie = `PHPSESSID=${match[1]}`;
      }
    }
    return res;
  }

  async login(): Promise<void> {
    const loginPage = await fetch(`${MAIDO_BASE}/users/login`);
    const setCookie = loginPage.headers.getSetCookie?.();
    if (setCookie) {
      for (const c of setCookie) {
        const match = c.match(/PHPSESSID=([^;]+)/);
        if (match) this.sessionCookie = `PHPSESSID=${match[1]}`;
      }
    }

    const body = new URLSearchParams({
      _method: "POST",
      "data[User][shop_id]": MAIDO_SHOP_ID,
      "data[User][login_id]": MAIDO_LOGIN_ID,
      "data[User][password]": MAIDO_PASSWORD,
    });

    const res = await this.fetchWithCookie(`${MAIDO_BASE}/users/login`, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      followRedirect: false,
    });

    if (res.status !== 302) throw new Error(`Worker${this.id}: ログイン失敗`);
  }

  async getTimecards(
    maidoId: string,
    year: number,
    month: number
  ): Promise<TimecardRecord[]> {
    const m = String(month).padStart(2, "0");
    const res = await this.fetchWithCookie(
      `${MAIDO_BASE}/timecards/view/${maidoId}/?from_y=${year}&from_m=${m}`
    );
    const html = await res.text();
    return parseTimecardHtml(html, year, month);
  }
}

// ============================================================
// タイムカードHTMLパーサ
// ============================================================
type TimecardRecord = {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakHours: number;
};

function parseTimecardHtml(
  html: string,
  year: number,
  month: number
): TimecardRecord[] {
  const records: TimecardRecord[] = [];
  const trBlocks = html.split("<tr>").slice(1);

  for (const block of trBlocks) {
    const dateMatch = block.match(/(\d+)\/(\d+)&nbsp;\(([^)]+)\)/);
    if (!dateMatch) continue;

    const dayMonth = parseInt(dateMatch[1]);
    const dayDate = parseInt(dateMatch[2]);

    const timeMatches = [
      ...block.matchAll(
        /<span class="blue_b">\s*(\d{1,2}:\d{2})?\s*<\/span>/g
      ),
    ];
    const clockIn = timeMatches[0]?.[1] || null;
    const clockOut = timeMatches[1]?.[1] || null;

    if (!clockIn && !clockOut) continue;

    const breakMatch = block.match(
      /bold_100p.*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<span[^>]*>\s*([\d.]+)\s*h/
    );
    const breakHours = breakMatch ? parseFloat(breakMatch[1]) : 0;

    let actualYear = year;
    if (dayMonth === 12 && month === 1) actualYear = year - 1;
    if (dayMonth === 1 && month === 12) actualYear = year + 1;

    const dateStr = `${actualYear}-${String(dayMonth).padStart(2, "0")}-${String(dayDate).padStart(2, "0")}`;
    records.push({ date: dateStr, clockIn, clockOut, breakHours });
  }

  return records;
}

// ============================================================
// スタッフ一覧取得（1回だけ）
// ============================================================
type MaidoStaff = { maidoId: string; name: string };

async function getStaffList(worker: MaidoWorker): Promise<MaidoStaff[]> {
  const allStaff: MaidoStaff[] = [];

  for (const shopId of SHOP_IDS) {
    for (const status of ["1", "0"]) {
      let page = 1;
      while (true) {
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
        const res = await worker["fetchWithCookie"](postUrl, {
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

        if (newCount === 0) break;
        page++;
      }
    }
  }

  return allStaff;
}

// ============================================================
// 月リスト生成
// ============================================================
function getMonthList(): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  for (
    let y = START_YEAR, m = START_MONTH;
    y < END_YEAR || (y === END_YEAR && m <= END_MONTH);
    m++
  ) {
    if (m > 12) {
      m = 1;
      y++;
    }
    months.push({ year: y, month: m });
  }
  return months;
}

// ============================================================
// 進捗トラッカー
// ============================================================
let globalImported = 0;
let globalSkipped = 0;
let staffCompleted = 0;
let totalStaffToProcess = 0;

function progressLog(workerId: number, msg: string) {
  const pct =
    totalStaffToProcess > 0
      ? Math.round((staffCompleted / totalStaffToProcess) * 100)
      : 0;
  console.log(`[W${workerId}] [${pct}% ${staffCompleted}/${totalStaffToProcess}] ${msg}`);
}

// ============================================================
// ワーカー処理: スタッフ1名分
// ============================================================
async function processStaff(
  worker: MaidoWorker,
  staff: MaidoStaff,
  scUserId: string,
  scEmployeeNumber: string
): Promise<{ imported: number; skipped: number }> {
  const months = getMonthList();
  let imported = 0;
  let skipped = 0;

  for (const { year, month } of months) {
    let records: TimecardRecord[];
    try {
      records = await worker.getTimecards(staff.maidoId, year, month);
    } catch {
      // ネットワークエラー時はリトライ
      await new Promise((r) => setTimeout(r, 1000));
      try {
        await worker.login();
        records = await worker.getTimecards(staff.maidoId, year, month);
      } catch {
        continue;
      }
    }

    if (records.length === 0) continue;

    for (const rec of records) {
      if (!rec.clockIn) continue;

      const [ciH, ciM] = rec.clockIn.split(":").map(Number);
      const clockIn = new Date(
        `${rec.date}T${String(ciH).padStart(2, "0")}:${String(ciM).padStart(2, "0")}:00+09:00`
      );

      let clockOut: Date | null = null;
      if (rec.clockOut) {
        const [coH, coM] = rec.clockOut.split(":").map(Number);
        let outDate = rec.date;
        if (coH < ciH || (coH === ciH && coM < ciM)) {
          const d = new Date(rec.date);
          d.setDate(d.getDate() + 1);
          outDate = d.toISOString().split("T")[0];
        }
        clockOut = new Date(
          `${outDate}T${String(coH).padStart(2, "0")}:${String(coM).padStart(2, "0")}:00+09:00`
        );
      }

      const existing = await prisma.attendance.findFirst({
        where: { userId: scUserId, clockIn },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const attendance = await prisma.attendance.create({
        data: {
          userId: scUserId,
          clockIn,
          clockOut,
          note: "MAIDO移行",
        },
      });

      if (rec.breakHours > 0 && clockOut) {
        const breakMinutes = Math.round(rec.breakHours * 60);
        const breakStart = new Date(clockIn.getTime() + 4 * 60 * 60 * 1000);
        const breakEnd = new Date(
          breakStart.getTime() + breakMinutes * 60 * 1000
        );
        await prisma.break.create({
          data: { attendanceId: attendance.id, breakStart, breakEnd },
        });
      }

      imported++;
    }

    // 軽い間隔
    await new Promise((r) => setTimeout(r, 50));
  }

  return { imported, skipped };
}

// ============================================================
// ワーカーループ
// ============================================================
async function workerLoop(
  worker: MaidoWorker,
  queue: {
    staff: MaidoStaff;
    scUserId: string;
    scEmployeeNumber: string;
  }[]
): Promise<void> {
  while (true) {
    const item = queue.shift();
    if (!item) break;

    const { staff, scUserId, scEmployeeNumber } = item;
    progressLog(
      worker.id,
      `${staff.name} (MAIDO:${staff.maidoId} → ${scEmployeeNumber})`
    );

    const { imported, skipped } = await processStaff(
      worker,
      staff,
      scUserId,
      scEmployeeNumber
    );

    globalImported += imported;
    globalSkipped += skipped;
    staffCompleted++;

    if (imported > 0) {
      progressLog(worker.id, `  → ${imported}件インポート, ${skipped}件スキップ`);
    }
  }
}

// ============================================================
// メイン
// ============================================================
async function main() {
  console.log(`=== MAIDO → SmartClock 並列移行 (${NUM_WORKERS}ワーカー) ===\n`);
  const startTime = Date.now();

  // ワーカー0でスタッフ一覧取得
  const worker0 = new MaidoWorker(0);
  await worker0.login();
  console.log("MAIDO ログイン成功");

  console.log("スタッフ一覧取得中...");
  const staffList = await getStaffList(worker0);
  console.log(`MAIDOスタッフ数: ${staffList.length}`);

  // SmartClockユーザー
  const scUsers = await prisma.user.findMany({
    select: { id: true, employeeNumber: true, name: true },
  });
  const nameMap = new Map<string, (typeof scUsers)[number][]>();
  for (const u of scUsers) {
    const arr = nameMap.get(u.name) || [];
    arr.push(u);
    nameMap.set(u.name, arr);
  }

  // キュー作成（マッチするスタッフのみ）
  const queue: {
    staff: MaidoStaff;
    scUserId: string;
    scEmployeeNumber: string;
  }[] = [];
  const unmatched: string[] = [];

  for (const staff of staffList) {
    const candidates = nameMap.get(staff.name);
    if (!candidates || candidates.length === 0) {
      unmatched.push(`${staff.maidoId}: ${staff.name}`);
      continue;
    }
    queue.push({
      staff,
      scUserId: candidates[0].id,
      scEmployeeNumber: candidates[0].employeeNumber,
    });
  }

  totalStaffToProcess = queue.length;
  console.log(`\n処理対象: ${queue.length}名, マッチなし: ${unmatched.length}名`);
  console.log(`期間: ${START_YEAR}/${START_MONTH} 〜 ${END_YEAR}/${END_MONTH}`);
  console.log(`ワーカー数: ${NUM_WORKERS}\n`);

  // 全ワーカーを起動（それぞれ独立セッション）
  const workers: MaidoWorker[] = [];
  for (let i = 0; i < NUM_WORKERS; i++) {
    const w = new MaidoWorker(i);
    await w.login();
    workers.push(w);
    // ログインの間隔
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`${NUM_WORKERS}ワーカー ログイン完了\n`);

  // 全ワーカーを並列実行（共有キューから取得）
  await Promise.all(workers.map((w) => workerLoop(w, queue)));

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n=== 完了 (${elapsed}秒) ===`);
  console.log(`インポート: ${globalImported}件`);
  console.log(`スキップ（重複）: ${globalSkipped}件`);

  if (unmatched.length > 0) {
    console.log(`\nマッチしなかったスタッフ (${unmatched.length}名):`);
    unmatched.forEach((s) => console.log(`  ${s}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
