-- =====================================================================
-- swim-log データベース定義
--
-- 使い方：Supabase ダッシュボード → SQL Editor → New query に
--         このファイルの中身を全部貼り付けて「Run」を押します（1回だけ）。
--
-- 方針：
--   ・全テーブルに user_id を持たせ、RLS で「自分の行だけ」読み書きできるようにする
--   ・タイムは 1/100 秒単位の整数（例：1:05.32 → 6532）で保存する
--   ・使用中の種目・プールは削除できない（on delete restrict）
-- =====================================================================


-- ---------------------------------------------------------------------
-- 共通：updated_at を自動更新する関数
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- ① strokes：種目マスタ
-- ---------------------------------------------------------------------
create table public.strokes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code        text not null check (char_length(code) between 1 and 20),
  name        text not null default '' check (char_length(name) <= 50),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, code)
);


-- ---------------------------------------------------------------------
-- ② pools：プールマスタ（SC = 短水路 / LC = 長水路）
-- ---------------------------------------------------------------------
create table public.pools (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 50),
  course      text not null check (course in ('SC', 'LC')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- ③ practices：練習記録（1日に複数件OK）
-- ---------------------------------------------------------------------
create table public.practices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  practice_date   date not null,
  pool_id         uuid not null references public.pools (id) on delete restrict,
  total_distance  int  not null default 0 check (total_distance between 0 and 100000),
  memo            text not null default '' check (char_length(memo) <= 5000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index practices_user_date_idx on public.practices (user_id, practice_date);


-- ---------------------------------------------------------------------
-- ④ practice_images：練習メニュー画像（実体は Storage の practice-images バケット）
-- ---------------------------------------------------------------------
create table public.practice_images (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  practice_id   uuid not null references public.practices (id) on delete cascade,
  storage_path  text not null unique,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);
create index practice_images_practice_idx on public.practice_images (practice_id);


-- ---------------------------------------------------------------------
-- ⑤ time_records：練習中のタイム（分析に使うのは format = 'TT' のみ）
-- ---------------------------------------------------------------------
create table public.time_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  practice_id  uuid not null references public.practices (id) on delete cascade,
  format       text not null check (format in ('TT', 'Short', 'Middle')),
  stroke_id    uuid not null references public.strokes (id) on delete restrict,
  distance     int  not null check (distance between 1 and 10000),
  time_cs      int  not null check (time_cs between 1 and 99999999),
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);
create index time_records_practice_idx on public.time_records (practice_id);
create index time_records_stroke_idx   on public.time_records (stroke_id);


-- ---------------------------------------------------------------------
-- ⑥ meets：大会
-- ---------------------------------------------------------------------
create table public.meets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  meet_date   date not null,
  venue       text not null default '' check (char_length(venue) <= 100),
  course      text not null check (course in ('SC', 'LC')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index meets_user_date_idx on public.meets (user_id, meet_date);


-- ---------------------------------------------------------------------
-- ⑦ meet_results：大会での種目ごとの結果（ベスト一覧の対象）
-- ---------------------------------------------------------------------
create table public.meet_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meet_id     uuid not null references public.meets (id) on delete cascade,
  stroke_id   uuid not null references public.strokes (id) on delete restrict,
  distance    int  not null check (distance between 1 and 10000),
  time_cs     int  not null check (time_cs between 1 and 99999999),
  note        text not null default '' check (char_length(note) <= 100),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index meet_results_meet_idx   on public.meet_results (meet_id);
create index meet_results_stroke_idx on public.meet_results (stroke_id);


-- ---------------------------------------------------------------------
-- updated_at の自動更新
-- ---------------------------------------------------------------------
create trigger strokes_updated_at   before update on public.strokes   for each row execute function public.set_updated_at();
create trigger pools_updated_at     before update on public.pools     for each row execute function public.set_updated_at();
create trigger practices_updated_at before update on public.practices for each row execute function public.set_updated_at();
create trigger meets_updated_at     before update on public.meets     for each row execute function public.set_updated_at();


-- =====================================================================
-- RLS（行レベルセキュリティ）
--   ログイン中のユーザー自身の行（user_id = auth.uid()）だけ、
--   読む・追加・変更・削除ができる。未ログイン（anon）は何もできない。
-- =====================================================================
alter table public.strokes         enable row level security;
alter table public.pools           enable row level security;
alter table public.practices       enable row level security;
alter table public.practice_images enable row level security;
alter table public.time_records    enable row level security;
alter table public.meets           enable row level security;
alter table public.meet_results    enable row level security;

create policy "own rows" on public.strokes         for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.pools           for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.practices       for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.practice_images for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.time_records    for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.meets           for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.meet_results    for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ログイン済みの利用者にテーブルの操作を許可する（実際に触れる行は上の RLS で自分の分だけに絞られる）
grant select, insert, update, delete
  on public.strokes, public.pools, public.practices, public.practice_images,
     public.time_records, public.meets, public.meet_results
  to authenticated;

-- 未ログインの利用者からはテーブルそのものを触れなくする（RLS に加えた二重の守り）
revoke all on public.strokes, public.pools, public.practices, public.practice_images,
              public.time_records, public.meets, public.meet_results from anon;


-- =====================================================================
-- 集計用ビュー
--   security_invoker = true にしないと、ビュー経由で RLS が効かなくなるので必須。
-- =====================================================================

-- ベストタイム：大会記録のみを対象に、水路×種目×距離ごとの最速 1 件
create view public.best_times
with (security_invoker = true)
as
select distinct on (m.course, r.stroke_id, r.distance)
  m.course,
  r.stroke_id,
  s.code       as stroke_code,
  s.name       as stroke_name,
  s.sort_order as stroke_sort_order,
  r.distance,
  r.time_cs,
  r.note,
  m.id         as meet_id,
  m.name       as meet_name,
  m.meet_date,
  m.venue
from public.meet_results r
join public.meets   m on m.id = r.meet_id
join public.strokes s on s.id = r.stroke_id
order by m.course, r.stroke_id, r.distance, r.time_cs asc, m.meet_date asc;

-- 月ごとの練習距離と練習日数
create view public.monthly_distance
with (security_invoker = true)
as
select
  date_trunc('month', practice_date)::date as month,
  sum(total_distance)::int                 as total_distance,
  count(distinct practice_date)::int       as practice_days
from public.practices
group by 1;

grant select on public.best_times, public.monthly_distance to authenticated;
revoke all on public.best_times, public.monthly_distance from anon;


-- =====================================================================
-- Storage：練習メニュー画像用の「非公開」バケット
--   保存場所は  {user_id}/{practice_id}/{ランダムID}.jpg
--   1階層目のフォルダ名が自分の user_id と一致するファイルだけ操作できる。
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('practice-images', 'practice-images', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "practice-images: read own"   on storage.objects for select to authenticated
  using (bucket_id = 'practice-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "practice-images: insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'practice-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "practice-images: update own" on storage.objects for update to authenticated
  using (bucket_id = 'practice-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "practice-images: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'practice-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
