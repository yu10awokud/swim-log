# Swim Log

水泳の練習・試合記録を管理する、自分専用の Web アプリです。

- **ログイン機能はありません。** URL を知っている人は誰でも閲覧・編集できるので、URL は人に教えないでください。
- データベースと画像には、アプリのサーバー経由でしかアクセスできません（ブラウザから Supabase を直接読むことはできません）。
- スマホでの入力を最優先にしたデザインです。

| 機能 | 画面 |
| --- | --- |
| 記録入力 | 日付・プール・総距離・メモ・画像（複数）・タイム（TT / Short / Middle） |
| カレンダー | 月表示。日ごとの総距離、月の合計距離と練習日数 |
| 分析 | TT タイムの推移（折れ線）、月別の練習距離（棒） |
| 試合記録 | 大会（名前・日付・会場・水路）と結果（種目・距離・タイム） |
| ベスト | 試合記録の中から、種目×距離ごとの最速タイム（短水路／長水路別） |
| マスタ管理 | 種目・プールの追加／編集／削除／並べ替え |

## 使っている技術

| 役割 | 使っているもの |
| --- | --- |
| 画面 | Next.js 15（App Router）+ TypeScript + Tailwind CSS |
| データベース・画像保存 | Supabase（PostgreSQL / Storage） |
| グラフ | Recharts |
| 公開 | Vercel |

## データを守る仕組み

```
スマホのブラウザ ──▶ Vercel 上のアプリ（サーバー） ──Secret key──▶ Supabase
        │                                                   ▲
        └──（画像の送信だけ。サーバーが発行した一時的な許可を使う）──┘
```

- Supabase の全テーブルで RLS を有効にし、ポリシーを 1 つも作っていません。そのため、ブラウザ用のキー（Publishable key）では何も読み書きできません。
- Secret key はサーバー側の環境変数だけに置き、ブラウザには送られません。
- 画像は非公開バケットに保存し、表示には 1 時間で失効する URL を使います。

---

## 目次

1. [Supabase の準備](#1-supabase-の準備)
2. [GitHub と Vercel をつなぐ](#2-github-と-vercel-をつなぐ)
3. [Vercel の環境変数とデプロイ](#3-vercel-の環境変数とデプロイ)
4. [機能ごとの動作確認](#4-機能ごとの動作確認)
5. [（任意）自分のパソコンで動かす](#5-任意自分のパソコンで動かす)
6. [フォルダ構成](#6-フォルダ構成)
7. [困ったときは](#7-困ったときは)

---

## 1. Supabase の準備

### 1-1. プロジェクトを作る

1. https://supabase.com/dashboard で「New project」を押します。
2. **Name** は `swim-log`、**Region** は `Northeast Asia (Tokyo)` にして作成します。
   - Database Password は「Generate a password」で作り、念のためメモしておきます。

### 1-2. テーブルを作る

1. 左メニューの「SQL Editor」→「New query」を開きます。
2. `supabase/schema.sql` の中身を**全部**貼り付けて「Run」を押します（1 回だけ）。
3. 「Success」と出れば完了です。テーブル・画像用バケット・種目の初期データ（Fr / Ba / Br / Fly / IM）がまとめて作られます。

> 以前の（ログイン機能ありの）`schema.sql` をすでに実行したプロジェクトでは、代わりに
> `supabase/migration_remove_auth.sql` を 1 回だけ実行してください。データは消えません。

### 1-3. 接続情報をメモする

「Project Settings」（左下の歯車）を開き、次の 3 つをメモします。

| 名前 | 場所 | 見た目 |
| --- | --- | --- |
| Project URL | Data API | `https://英数字.supabase.co` |
| Publishable key | API Keys →「Publishable key」 | `sb_publishable_...` |
| Secret key | API Keys →「Secret keys」（目のアイコンで表示してコピー） | `sb_secret_...` |

- 「Legacy API Keys」タブの `anon public` キーは Publishable key の代わりに、`service_role` キーは Secret key の代わりに使えます。
- 🔒 **Secret key はデータベースの全権限を持つ鍵です。** Vercel の環境変数以外（チャット、GitHub、メモアプリなど）には貼らないでください。

---

## 2. GitHub と Vercel をつなぐ

1. https://vercel.com/new を開き、`swim-log` の「Import」を押します。
   - 一覧に出てこないときは「Adjust GitHub App Permissions」から `swim-log` へのアクセスを許可します。
2. 「Framework Preset」が **Next.js** になっていることを確認します。
3. **まだ「Deploy」は押さずに**、次の環境変数に進みます。

---

## 3. Vercel の環境変数とデプロイ

### 3-1. 環境変数を設定する

「Environment Variables」に次の 3 つを追加します（すでにデプロイ済みなら、プロジェクトの「Settings」→「Environment Variables」）。

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key |

⚠️ `SUPABASE_SECRET_KEY` の名前は **`NEXT_PUBLIC_` で始めないでください。** `NEXT_PUBLIC_` で始まる値はブラウザに送られてしまいます。

### 3-2. デプロイする

1. 「Deploy」を押します（すでにデプロイ済みなら「Deployments」→ 最新の「…」→「Redeploy」）。
2. 表示された URL をスマホで開き、カレンダーが出れば完了です。
3. スマホの「ホーム画面に追加」をしておくと、アプリのように使えます。

### 3-3. その後の更新

- `main` ブランチに push すると、Vercel が自動で再デプロイします。
- **環境変数を変えたときは自動では反映されません。** 「Redeploy」を押してください。

---

## 4. 機能ごとの動作確認

公開 URL（またはローカルの http://localhost:3000）で、上から順に確認してください。

### ① マスタ管理

- [ ] 「種目」タブに Fr / Ba / Br / Fly / IM が並んでいる
- [ ] 「プール」タブで「踏水会」＋「短水路」を追加できる
- [ ] 編集・▲▼ での並べ替え・削除ができる
- [ ] 練習記録で使った種目・プールを削除しようとすると「使用中のため削除できません」と出る

### ② 記録入力

- [ ] 「記録入力」を開くと、日付が今日になっている
- [ ] タイム欄に `10532` と打つと `1:05.32` と表示される
- [ ] 画像を複数枚追加して保存すると、その日の詳細画面に移動し、画像が表示される
- [ ] 画像をタップすると全画面表示になり、左右スワイプで切り替わる
- [ ] 「編集」で内容の変更・画像の削除ができ、「削除」で記録ごと消える

### ③ カレンダー

- [ ] 練習した日に総距離（例：`5.2k`）が表示され、距離が多い日ほど色が濃い
- [ ] 上部に、その月の合計距離・練習日数・1 日平均が表示される
- [ ] 日付をタップすると日別詳細が開き、「＋ この日に記録を追加」からその日付で入力できる

### ④ ベスト（試合記録を 1 件以上登録してから）

- [ ] 「短水路」「長水路」で切り替わる
- [ ] 同じ種目・距離の記録が複数あるとき、一番速いタイムだけが表示される
- [ ] 練習の TT タイムは表示されない（試合記録のみが対象）

### ⑤ 試合記録

- [ ] 「＋ 追加」で大会情報と結果を複数行入力でき、一覧で編集・削除できる

### ⑥ 分析

- [ ] 「TT推移」：形式が TT のタイムだけが折れ線で表示される（Short / Middle は出ない）
- [ ] 「月別距離」：直近 12 か月の棒グラフと合計が表示される

---

## 5. （任意）自分のパソコンで動かす

公開前に変更を試したいときだけ必要です。

1. **Node.js 20 以上**（https://nodejs.org/ja の LTS）と **Git** をインストールします。
2. 次を実行します。

   ```bash
   git clone https://github.com/yu10awokud/swim-log.git
   cd swim-log
   npm install
   cp .env.local.example .env.local      # Windows のコマンドプロンプトなら： copy .env.local.example .env.local
   ```

3. `.env.local` に、1-3 でメモした 3 つの値を書き込みます。
4. `npm run dev` で起動し、http://localhost:3000 を開きます（止めるときは `Ctrl + C`）。

---

## 6. フォルダ構成

```
app/
  (app)/              すべての画面（layout.tsx が共通レイアウト）
    calendar/         カレンダー
    day/[date]/       日別詳細
    practices/        記録入力・編集（actions.ts が保存処理）
    meets/            試合記録（actions.ts が保存処理）
    bests/            ベスト
    analysis/         分析グラフ
    masters/          マスタ管理
components/           複数の画面で使う部品（入力フォーム、タイム入力欄、画像表示など）
lib/
  supabase/server.ts  サーバー専用の Supabase 接続（Secret key を使用）
  supabase/client.ts  ブラウザ用（画像の送信だけに使用）
  time.ts             タイムの変換（6532 ⇔ "1:05.32"）
  date.ts             日付の処理（日本時間）
  types.ts            データの型と表示名
supabase/
  schema.sql                  テーブル・集計ビュー・Storage・種目の初期データ
  migration_remove_auth.sql   旧（ログインあり）版からの移行用
```

### データの持ち方のポイント

- **タイム**は「1/100 秒単位の整数」で保存しています（`1:05.32` → `6532`）。
- **短水路／長水路**は、練習ではプールの設定から、試合では大会の設定から決まります。
- **ベスト**は、データベースの `best_times` ビューで集計しています（試合記録のみ）。

---

## 7. 困ったときは

| 症状 | 確認すること |
| --- | --- |
| 「Application error」や真っ白な画面になる | Vercel の環境変数 3 つの**名前と値**が正しいか。変更後に Redeploy したか。Vercel の「Logs」に「環境変数 … が設定されていません」と出ていないか |
| データが表示されない・保存できない | `schema.sql`（または移行用 SQL）を最後まで実行できたか。URL と Secret key が `swim-log` プロジェクトのものか |
| 画像がアップロードできない | Storage に `practice-images` バケットがあるか |
| しばらく使わなかったら動かない | Supabase の無料プランは **7 日間アクセスがないと一時停止**します。ダッシュボードでプロジェクトを開き「Restore」を押してください（データは消えません） |

### 無料枠の目安

- Supabase Free：データベース 500 MB、Storage 1 GB。
  - 画像はアップロード前に約 300 KB まで縮小しているので、3,000 枚程度は保存できます。
- Vercel Hobby：個人・非商用の利用は無料です。
