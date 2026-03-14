# タイムカードシステム — CLAUDE.md

> **このファイルはClaude Codeエージェントへの指示書です。**
> 実装を始める前に必ず全文を読んでください。不明点は作業を止めて確認してください。

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [ディレクトリ構成](#3-ディレクトリ構成)
4. [開発コマンド](#4-開発コマンド)
5. [コーディング規約](#5-コーディング規約)
6. [データベース設計](#6-データベース設計)
7. [ビジネスルール](#7-ビジネスルール)
8. [API設計方針](#8-api設計方針)
9. [認証・権限](#9-認証権限)
10. [エージェント担当分け](#10-エージェント担当分け)

---

## 1. プロジェクト概要

訪問介護・配食事業者向けの**勤怠管理システム**。正社員（約50名）の出退勤打刻・申請・承認・月次集計を管理する。

### 対象ユーザーと権限

| role | 説明 | 主な操作 |
|------|------|---------|
| `employee` | 一般従業員 | 打刻・申請 |
| `manager` | 部門長 | 部下の承認（第1段階） |
| `hr` | 人事・総務 | 全社集計・レポート出力 |
| `admin` | システム管理者 | マスタ管理・最終承認（第2段階） |

### 部署・打刻方式

| 部署例 | punch_type | 説明 |
|--------|-----------|------|
| 介護部門 | `single` | 1日1回（出勤・退勤） |
| 配食部門（配達チーム） | `multiple` | 1日N回（午前の部・午後の部など） |
| 事務・管理 | `single` | 1日1回 |

---

## 2. 技術スタック

```
フロントエンド : Next.js 14 (App Router) + TypeScript
バックエンドAPI : Hono (Node.js) + TypeScript
データベース   : MySQL 8.0 / MariaDB 10.6+
ORM           : Prisma
モノレポ管理   : Turborepo
認証          : NextAuth.js v5 (JWT戦略)
スタイリング   : Tailwind CSS + shadcn/ui
バリデーション : Zod
```

---

## 3. ディレクトリ構成

```
timecard-system/
├── CLAUDE.md                  ← このファイル
├── package.json               # ルート（Turborepo）
├── turbo.json
├── docker-compose.yml         # MySQL開発環境
├── .env.example
│
├── packages/
│   ├── types/                 # 【最初に実装】全エージェント共通の型定義
│   │   └── src/
│   │       ├── index.ts
│   │       ├── user.ts
│   │       ├── attendance.ts
│   │       ├── approval.ts
│   │       └── report.ts
│   └── utils/                 # 共通ユーティリティ
│       └── src/
│           ├── dateUtils.ts   # 日付・時刻操作
│           ├── workCalc.ts    # 労働時間・残業計算
│           └── geoUtils.ts    # ジオフェンス判定
│
├── apps/
│   ├── web/                   # Next.js フロントエンド
│   │   └── src/
│   │       ├── app/           # App Router ページ
│   │       ├── components/    # UIコンポーネント
│   │       ├── hooks/         # カスタムフック
│   │       └── lib/           # 認証・APIクライアント
│   │
│   └── api/                   # Hono バックエンド
│       └── src/
│           ├── index.ts       # エントリーポイント
│           ├── routes/        # ルーティング
│           ├── controllers/   # コントローラー
│           ├── services/      # ビジネスロジック
│           └── middleware/    # 認証・権限チェック
│
└── database/
    └── prisma/
        ├── schema.prisma      # スキーマ定義
        ├── migrations/        # マイグレーション履歴
        └── seed.ts            # 初期データ
```

---

## 4. 開発コマンド

```bash
# セットアップ
cp .env.example .env
docker-compose up -d           # MySQL起動
pnpm install                   # 依存パッケージインストール
pnpm db:migrate                # マイグレーション実行
pnpm db:seed                   # 初期データ投入

# 開発サーバー起動（全アプリ同時）
pnpm dev

# 個別起動
pnpm dev --filter=web          # フロントエンドのみ
pnpm dev --filter=api          # APIのみ

# データベース操作
pnpm db:migrate                # prisma migrate dev
pnpm db:studio                 # Prisma Studio起動
pnpm db:reset                  # DBリセット（開発のみ）

# テスト・ビルド
pnpm test
pnpm build
pnpm lint
pnpm typecheck
```

---

## 5. コーディング規約

### 全般

- **TypeScript strict モードを使用**。`any` は原則禁止。型が不明な場合は `unknown` を使い、ガード処理を書くこと
- **Zod でバリデーション**。APIの入力値は必ずZodスキーマで検証する
- **エラーハンドリング**。try-catchを使い、エラーはそのままthrowせずにアプリ独自のエラークラスに変換する
- **コメント**。複雑なビジネスロジックには日本語コメントを書くこと

### 命名規則

```typescript
// ファイル名：kebab-case
attendance-service.ts

// 型・クラス・コンポーネント：PascalCase
type AttendancePunch = { ... }
class AttendanceService { ... }

// 関数・変数：camelCase
const totalWorkMin = calcWorkMinutes(punches)

// 定数：SCREAMING_SNAKE_CASE
const MAX_OVERTIME_MIN = 720

// DBカラム・Prismaモデル：snake_case（Prismaの規約に従う）
```

### フロントエンド固有

- **Server Components を基本とし**、インタラクションが必要な部分だけ `"use client"` を付ける
- **データフェッチは Server Component** で行い、Clientにpropsとして渡す
- `packages/types` の型をそのまま利用し、フロント独自で型を再定義しない

### バックエンド固有

- **ルーティングはHono**、ビジネスロジックは `services/` に切り出す
- **コントローラーはthin**に保ち、バリデーションとサービス呼び出しのみ行う
- データベース操作は必ず `services/` 内で行い、ルートから直接Prismaを呼ばない

---

## 6. データベース設計

### 主要テーブルと関係

```
departments ──< users ──< attendances ──< attendance_punches
                      \──< leave_requests ──< approval_flows
                      \──< correction_requests ──< approval_flows
attendances ──< attendance_alerts
alert_thresholds（システム全体で1行）
monthly_summaries（月次集計キャッシュ）
```

### 重要なテーブル仕様

#### attendances（日次勤怠）
- `UNIQUE(user_id, date)` — 1人1日1レコード
- `total_work_min` — 紐づく全 `attendance_punches` の合計（サービス層で計算して保存）
- `overtime_min` — `total_work_min - (work_patterns.work_hours × 60)` の差分
- `is_flagged` — 1件以上のアラートがある場合 `true`（一覧表示の高速化用）

#### attendance_punches（打刻セット）
- `single` 部署 → `sequence = 1` の1行のみ
- `multiple` 部署 → `sequence = 1, 2, …` と複数行
- `punch_out` は退勤前 `NULL`（退勤打刻時に更新）
- `work_min` — `punch_out - punch_in` を分単位で保存（`punch_out` 更新時に同時計算）

#### approval_flows（承認フロー）
- `stage = 1` → 部門長承認
- `stage = 2` → システム管理者承認
- 申請作成時に `stage = 1` のレコードを自動生成する
- `stage = 1` が `approved` になったら `stage = 2` のレコードを自動生成する
- `stage = 1` が `rejected` になったら申請の `status` を `rejected` に更新して終了

#### alert_thresholds
- 常に `id = 1` の1行のみ存在
- 初期値はseedで投入する

### Prismaスキーマの注意点

```prisma
// 日時はすべて DateTime @db.Timestamp(0) を使う（ミリ秒不要）
// 緯度経度は Decimal @db.Decimal(10, 7)
// ENUMはPrismaのenumで定義する（MySQLのENUMと対応させる）
```

---

## 7. ビジネスルール

### 残業時間の計算

```typescript
// overtime_min = total_work_min - 所定労働時間(分)
// 所定労働時間はwork_patternsから取得
// overtime_minが負の場合は0として保存（早退しても残業はマイナスにならない）
const overtimeMin = Math.max(0, totalWorkMin - scheduledWorkMin)
```

### ジオフェンス判定

```typescript
// departments.geofence_radius が null の場合 → 制限なし（直行直帰OK）
// null でない場合 → 打刻位置と事業所座標のハバーサイン距離を計算
// 距離 > geofence_radius(m) の場合 → 打刻エラーを返す
// 判定ロジックは packages/utils/src/geoUtils.ts に実装すること
```

### 異常打刻の検知タイミング

- **リアルタイム検知**：打刻時に即座にチェック（深夜打刻・GPS制限違反）
- **日次バッチ**：毎日23:59に前日分を再チェック（長時間勤務・残業超過）
- 検知結果は `attendance_alerts` に保存し、`attendances.is_flagged` を更新する

### アラートの重要度

| alert_type | severity | 検知条件（初期値） |
|-----------|---------|-----------------|
| `late_night` | `medium` | 23:00以降または05:00以前の打刻 |
| `long_hours` | `high` | 休憩なし8時間以上の連続打刻 |
| `overtime` | `high` | 1日の実労働が12時間超 |
| `schedule_deviation` | `low` | 所定時刻より60分以上の早出・遅刻 |

### 有給の単位

- 全日 = `1.0` 日
- 午前半日 = `0.5` 日
- 午後半日 = `0.5` 日
- `monthly_summaries.leave_days_used` に合計して保存

---

## 8. API設計方針

### エンドポイント規則

```
GET    /api/attendances/:userId/:year/:month   # 月次勤怠一覧
POST   /api/attendances/:userId/punch-in       # 出勤打刻
POST   /api/attendances/:userId/punch-out      # 退勤打刻
GET    /api/correction-requests                # 修正申請一覧
POST   /api/correction-requests                # 修正申請作成
PATCH  /api/approval-flows/:id                 # 承認・差し戻し
GET    /api/reports/monthly                    # 月次レポート（集計）
GET    /api/reports/monthly/export/csv         # CSVエクスポート
GET    /api/reports/monthly/export/pdf         # PDFエクスポート
GET    /api/alerts                             # 異常アラート一覧（管理者・人事のみ）
PATCH  /api/alerts/:id/acknowledge             # アラート確認済みにする
```

### レスポンス形式

```typescript
// 成功
{ success: true, data: T }

// エラー
{ success: false, error: { code: string, message: string } }

// ページネーション
{ success: true, data: T[], pagination: { page: number, limit: number, total: number } }
```

### エラーコード

```
UNAUTHORIZED        認証エラー
FORBIDDEN           権限不足
NOT_FOUND           リソースが存在しない
ALREADY_PUNCHED_IN  すでに出勤打刻済み
GEOFENCE_VIOLATION  ジオフェンス範囲外
INVALID_INPUT       バリデーションエラー
INTERNAL_ERROR      サーバーエラー
```

---

## 9. 認証・権限

### JWT ペイロード

```typescript
type JWTPayload = {
  sub: string        // user.id
  role: UserRole     // employee | manager | hr | admin
  departmentId: number
  exp: number
}
```

### ミドルウェアの使い方

```typescript
// apps/api/src/middleware/auth.ts
app.use('/api/*', authMiddleware)          // 認証必須
app.use('/api/alerts/*', roleGuard('manager', 'hr', 'admin'))  // 役割制限
app.use('/api/admin/*', roleGuard('admin'))

// roleGuard は指定したrole以外を403で弾く
```

### フロントエンドでの権限制御

```typescript
// コンポーネント内での権限チェック
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
if (session?.user.role !== 'manager') return null
```

---

## 10. エージェント担当分け

> **必ず Phase 1 を完了してから Phase 2 を開始してください。**
> 各エージェントは自分の担当範囲外のファイルを編集しないこと。

### Phase 1 — 基盤（直列・順番通りに実行）

| 順番 | 担当 | 作業内容 | 完了条件 |
|------|------|---------|---------|
| 1 | **Agent: DB** | `database/prisma/schema.prisma` を ERD通りに実装し、マイグレーション実行 | `pnpm db:migrate` が成功する |
| 2 | **Agent: Types** | `packages/types/src/` に全型定義を実装 | `pnpm typecheck` が通る |
| 3 | **Agent: Utils** | `packages/utils/src/` に計算・判定ロジックを実装、単体テストを書く | `pnpm test` が通る |

### Phase 2 — バックエンドAPI（Phase 1完了後、並列実行可）

| 担当 | 作業内容 | 参照すべきファイル |
|------|---------|-----------------|
| **Agent: Auth API** | NextAuth設定・JWT発行・ログインAPI | `packages/types/user.ts`, `middleware/auth.ts` |
| **Agent: Attendance API** | 打刻API・ジオフェンス判定・アラート検知 | `packages/utils/geoUtils.ts`, `services/attendanceService.ts` |
| **Agent: Request API** | 修正申請・有給申請・承認フローAPI | `packages/types/approval.ts` |
| **Agent: Report API** | 月次集計・CSV/PDFエクスポート | `packages/utils/workCalc.ts` |

### Phase 3 — フロントエンド（Phase 2完了後、並列実行可）

| 担当 | 作業内容 |
|------|---------|
| **Agent: Auth UI** | ログイン画面・セッション管理 |
| **Agent: Punch UI** | 打刻画面（ダッシュボード） |
| **Agent: Timecard UI** | タイムカード一覧・月次表示 |
| **Agent: Request UI** | 修正申請・有給申請フォーム |
| **Agent: Approval UI** | 承認管理画面（管理者） |
| **Agent: Report UI** | 集計・レポート画面（人事） |
| **Agent: Alert UI** | 異常アラート一覧（管理者・人事） |
| **Agent: Admin UI** | マスタ管理・ユーザー管理（admin） |

### 各エージェントが作業開始時にすること

1. このファイル（`CLAUDE.md`）を全文読む
2. 担当するファイルの一覧を確認する
3. 依存するパッケージ・型が存在するか確認する（なければ止めて報告）
4. 実装 → `pnpm typecheck` → `pnpm lint` の順で確認してからコミット

### 絶対に守ること

- `packages/types/` の型を変更する場合は他エージェントに必ず共有する
- DBスキーマを変更する場合はマイグレーションファイルを作成し、`schema.prisma` も更新する
- `any` を使わない
- APIのレスポンス形式（セクション8）から逸脱しない
- アラート情報を `employee` ロールに返すAPIを作らない

---

*最終更新: 2026年2月*
