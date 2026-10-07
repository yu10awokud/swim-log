# Swim Log

水泳の練習・試合記録を管理する、自分専用の Web アプリです。

- ログインできるのは自分のアカウント 1 つだけです（新規登録はできません）。
- データは Supabase の RLS（行レベルセキュリティ）で、画像は非公開バケットで守られています。
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
| データベース・認証・画像保存 | Supabase（PostgreSQL / Auth / Storage） |
| グラフ | Recharts |
| 公開 | Vercel |

---

## 目次

1. [Supabase の準備](#1-supabase-の準備)
2. [自分のパソコンで動かす](#2-自分のパソコンで動かす)
3. [GitHub と Vercel をつなぐ](#3-github-と-vercel-をつなぐ)
4. [Vercel の環境変数とデプロイ](#4-vercel-の環境変数とデプロイ)
5. [機能ごとの動作確認](#5-機能ごとの動作確認)
6. [フォルダ構成](#6-フォルダ構成)
7. [困ったときは](#7-困ったときは)

---

## 1. Supabase の準備

### 1-1. プロジェクトを作る

1. https://supabase.com/dashboard を開いて「New project」を押します。
2. 次のように入力して「Create new project」を押します。
   - **Name**：`swim-log`
   - **Database Password**：「Generate a password」で作ってメモしておきます（このアプリでは使いませんが、再発行が面倒なため）
   - **Region**：`Northeast Asia (Tokyo)`
3. 準備ができるまで 1〜2 分待ちます。

### 1-2. テーブルを作る

1. 左メニューの「SQL Editor」を開き、「New query」を押します。
2. このリポジトリの `supabase/schema.sql` の中身を**全部**コピーして貼り付け、「Run」を押します。
3. 「Success. No rows returned」と表示されれば成功です。
   - 左メニューの「Table Editor」に、`strokes` `pools` `practices` などのテーブルが並びます。
   - 各テーブルに「RLS enabled」と表示されていることも確認してください。

> ⚠️ `schema.sql` は **1 回だけ**実行してください。2 回目は「already exists」エラーになります（データは壊れません）。

### 1-3. 画像の保存場所（Storage）を確認する

`schema.sql` を実行すると、画像用のバケットも自動で作られます。

1. 左メニューの「Storage」を開きます。
2. `practice-images` というバケットがあり、**「Public」の表示が付いていない（非公開）**ことを確認します。
3. 「Policies」タブを開き、`practice-images: read own` など 4 つのポリシーがあることを確認します。

### 1-4. 新規登録をできないようにする（重要）

1. 左メニューの「Authentication」→「Sign In / Providers」を開きます。
2. 「**Allow new users to sign up**」を**オフ**にして「Save changes」を押します。
3. 同じ画面の「Email」プロバイダーが有効（Enabled）になっていることを確認します。

### 1-5. 自分のログインアカウントを作る

1. 「Authentication」→「Users」を開き、「Add user」→「Create new user」を押します。
2. メールアドレスとパスワードを入力し、「**Auto Confirm User**」にチェックを入れて「Create user」を押します。
   - パスワードは推測されにくいもの（12 文字以上）にしてください。

### 1-6. 種目の初期データを入れる

1. 「SQL Editor」→「New query」を開きます。
2. `supabase/seed_strokes.sql` の中身を貼り付けて「Run」を押します。
3. 「Table Editor」→ `strokes` に、Fr / Ba / Br / Fly / IM の 5 件が入っていれば成功です。

※ プールは、アプリの「マスタ管理」画面から追加してください。

### 1-7. 接続情報をメモする

1. 画面上部の「**Connect**」ボタン、または「Project Settings」→「API Keys」を開きます。
2. 次の 2 つをメモします。
   - **Project URL**（`https://xxxx.supabase.co`）
   - **Publishable key**（`sb_publishable_...` で始まるもの。古いプロジェクトでは「anon public」キー）

> 🔒 「**secret**」キーや「**service_role**」キーは、このアプリでは**使いません**。どこにも貼り付けないでください。

---

## 2. 自分のパソコンで動かす

### 2-1. 必要なもの

- **Node.js 20 以上**（https://nodejs.org/ja から「LTS」をインストール）
- **Git**

### 2-2. 手順

```bash
# 1. リポジトリを手元にコピー
git clone https://github.com/yu10awokud/swim-log.git
cd swim-log

# 2. 必要なライブラリをインストール（初回だけ。数分かかります）
npm install

# 3. 環境変数ファイルを作る
cp .env.local.example .env.local      # Windows のコマンドプロンプトなら： copy .env.local.example .env.local
```

`.env.local` をメモ帳などで開き、1-7 でメモした 2 つの値に書き換えます。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
```

```bash
# 4. 起動
npm run dev
```

ブラウザで http://localhost:3000 を開くと、ログイン画面が出ます。1-5 で作ったアカウントでログインしてください。
止めるときは、ターミナルで `Ctrl + C` を押します。

> `.env.local` は `.gitignore` に入っているので、GitHub には上がりません。

### スマホから動作確認したいとき

パソコンとスマホを同じ Wi-Fi につないで、次のように起動します。

```bash
npm run dev -- -H 0.0.0.0
```

パソコンの IP アドレス（例：`192.168.1.10`）を調べ、スマホで `http://192.168.1.10:3000` を開きます。

---

## 3. GitHub と Vercel をつなぐ

1. https://vercel.com/new を開きます（GitHub アカウントでログイン）。
2. 「Import Git Repository」に `swim-log` が出てこない場合は、「Adjust GitHub App Permissions」を押し、`swim-log` へのアクセスを許可します。
3. `swim-log` の横の「Import」を押します。
4. 「Framework Preset」が **Next.js** になっていることを確認します（自動で選ばれます）。
5. **まだ「Deploy」は押さずに**、次の「4. 環境変数」に進みます。

---

## 4. Vercel の環境変数とデプロイ

### 4-1. 環境変数を設定する

Import 画面の「Environment Variables」を開き、次の 2 つを追加します（値は 1-7 でメモしたもの）。

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_xxxx` |

### 4-2. デプロイする

1. 「Deploy」を押します。1〜2 分で完了します。
2. 表示された URL（例：`https://swim-log-xxxx.vercel.app`）をスマホで開き、ログインできることを確認します。
3. スマホの「ホーム画面に追加」をしておくと、アプリのように使えます。

### 4-3. Supabase に公開 URL を登録する

1. Supabase の「Authentication」→「URL Configuration」を開きます。
2. 「Site URL」を、Vercel の URL（`https://swim-log-xxxx.vercel.app`）に変更して保存します。

### 4-4. その後の更新

`main` ブランチに push すると、Vercel が自動で再デプロイします。

### あとから環境変数を変えたいとき

Vercel のプロジェクト →「Settings」→「Environment Variables」で編集します。
**変えたあとは「Deployments」→ 最新のデプロイの「…」→「Redeploy」が必要です**（自動では反映されません）。

---

## 5. 機能ごとの動作確認

`npm run dev` で起動した状態で、上から順に確認してください。

### ① 認証

- [ ] ログインしていない状態で http://localhost:3000/calendar を開くと、ログイン画面に移動する
- [ ] 間違ったパスワードでは「メールアドレスまたはパスワードが違います」と出る
- [ ] 正しいパスワードでログインすると、カレンダー画面に移動する
- [ ] メニュー（スマホは左上の ☰）→「ログアウト」で、ログイン画面に戻る

### ② マスタ管理

- [ ] 「種目」タブに Fr / Ba / Br / Fly / IM が並んでいる
- [ ] 「プール」タブで「踏水会」＋「短水路」を追加できる
- [ ] 編集・▲▼での並べ替え・削除ができる
- [ ] 練習記録で使った種目・プールを削除しようとすると「使用中のため削除できません」と出る

### ③ 記録入力

- [ ] 「記録入力」を開くと、日付が今日になっている
- [ ] タイム欄に `10532` と打つと `1:05.32` と表示される
- [ ] 画像を複数枚追加して保存すると、その日の詳細画面に移動し、画像が表示される
- [ ] 画像をタップすると全画面表示になり、左右スワイプで切り替わる
- [ ] 「編集」で内容を変更・画像の削除ができ、「削除」で記録ごと消える
- [ ] Supabase の「Storage」→ `practice-images` に、画像が `ユーザーID/練習ID/…jpg` の形で保存されている

### ④ カレンダー

- [ ] 練習した日に総距離（例：`5.2k`）が表示され、距離が多い日ほど色が濃い
- [ ] 上部に、その月の合計距離・練習日数・1 日平均が表示される
- [ ] ‹ › で前の月・次の月に移動できる
- [ ] 日付をタップすると日別詳細が開き、「＋ この日に記録を追加」からその日付で入力できる

### ⑤ ベスト（試合記録を 1 件以上登録してから）

- [ ] 「短水路」「長水路」で切り替わる
- [ ] 同じ種目・距離で複数の記録があるとき、一番速いタイムだけが表示される
- [ ] 練習の TT タイムは**表示されない**（試合記録のみが対象）
- [ ] 行をタップすると、試合記録一覧のその大会に移動する

### ⑥ 試合記録

- [ ] 「＋ 追加」で大会名・日付・会場・水路と、結果を複数行入力できる
- [ ] 一覧に新しい順で並び、「編集」「削除」ができる

### ⑦ 分析

- [ ] 「TT推移」：形式が TT のタイムだけが、種目×距離ごとの折れ線で表示される（Short / Middle は出ない）
- [ ] 短水路／長水路で切り替わる。グラフの点に触れるとタイムが表示される
- [ ] 「月別距離」：直近 12 か月の棒グラフと合計が表示される
- [ ] 「表で見る」で数値を一覧できる

### ⑧ セキュリティの確認（デプロイ後に一度だけ）

- [ ] シークレットウィンドウで公開 URL を開くと、ログイン画面しか見えない
- [ ] 画像の URL（全画面表示の「原寸で開く」）を 1 時間以上たってから開くと、表示されない（期限切れ）

---

## 6. フォルダ構成

```
app/
  login/              ログイン画面とログイン・ログアウト処理
  (app)/              ログインが必要な画面（このフォルダの layout.tsx でログインを確認）
    calendar/         カレンダー
    day/[date]/       日別詳細
    practices/        記録入力・編集（actions.ts が保存処理）
    meets/            試合記録（actions.ts が保存処理）
    bests/            ベスト
    analysis/         分析グラフ
    masters/          マスタ管理
components/           複数の画面で使う部品（入力フォーム、タイム入力欄、画像表示など）
lib/
  supabase/           Supabase への接続（サーバー用・ブラウザ用・middleware 用）
  time.ts             タイムの変換（6532 ⇔ "1:05.32"）
  date.ts             日付の処理（日本時間）
  types.ts            データの型と表示名
middleware.ts         全ページ共通：未ログインならログイン画面へ
supabase/
  schema.sql          テーブル・RLS・集計ビュー・Storage の定義
  seed_strokes.sql    種目の初期データ
```

### データの持ち方のポイント

- **タイム**は「1/100 秒単位の整数」で保存しています（`1:05.32` → `6532`）。
- **短水路／長水路**は、練習ではプールの設定から、試合では大会の設定から決まります。
- **ベスト**は、データベースの `best_times` ビューで集計しています（試合記録のみ）。

---

## 7. 困ったときは

| 症状 | 確認すること |
| --- | --- |
| ログインできない | Supabase の「Authentication」→「Users」にアカウントがあり、「Confirmed」になっているか |
| 画面が真っ白／エラーになる | `.env.local`（Vercel では環境変数）の 2 つの値が正しいか。変更後に `npm run dev` を再起動したか |
| データが表示されない | `schema.sql` を最後まで実行できたか（途中でエラーになっていないか） |
| 種目が 1 つもない | 1-5 でアカウントを作った**あと**に `seed_strokes.sql` を実行したか |
| 画像がアップロードできない | Storage に `practice-images` バケットとポリシーがあるか |
| しばらく使わなかったら動かない | Supabase の無料プランは **7 日間アクセスがないと一時停止**します。ダッシュボードでプロジェクトを開き「Restore」を押してください（データは消えません） |

### 無料枠の目安

- Supabase Free：データベース 500 MB、Storage 1 GB。
  - 画像はアップロード前に約 300 KB まで縮小しているので、3,000 枚程度は保存できます。
- Vercel Hobby：個人・非商用の利用は無料です。
