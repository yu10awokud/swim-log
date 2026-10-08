-- =====================================================================
-- 【すでに schema.sql を実行済みのプロジェクト用】ログイン機能を外すための変更
--
-- 使い方：Supabase → SQL Editor → New query に全部貼り付けて「Run」（1回だけ）。
--         データは消えません。
--         これから新しく作るプロジェクトでは、このファイルは不要です（schema.sql だけ実行）。
-- =====================================================================

-- 1. 「自分の行だけ」のポリシーを削除（ポリシーなし＝ブラウザからは一切アクセス不可）
drop policy if exists "own rows" on public.strokes;
drop policy if exists "own rows" on public.pools;
drop policy if exists "own rows" on public.practices;
drop policy if exists "own rows" on public.practice_images;
drop policy if exists "own rows" on public.time_records;
drop policy if exists "own rows" on public.meets;
drop policy if exists "own rows" on public.meet_results;

drop policy if exists "practice-images: read own"   on storage.objects;
drop policy if exists "practice-images: insert own" on storage.objects;
drop policy if exists "practice-images: update own" on storage.objects;
drop policy if exists "practice-images: delete own" on storage.objects;

-- 2. user_id 列を削除（関連する索引・一意制約も一緒に消える）
alter table public.strokes         drop column if exists user_id;
alter table public.pools           drop column if exists user_id;
alter table public.practices       drop column if exists user_id;
alter table public.practice_images drop column if exists user_id;
alter table public.time_records    drop column if exists user_id;
alter table public.meets           drop column if exists user_id;
alter table public.meet_results    drop column if exists user_id;

-- 3. 索引と一意制約を作り直す
create index if not exists practices_date_idx on public.practices (practice_date);
create index if not exists meets_date_idx     on public.meets (meet_date);
alter table public.strokes add constraint strokes_code_key unique (code);

-- 4. ブラウザ側の役割（anon / authenticated）からテーブルの権限を外す
revoke all on public.strokes, public.pools, public.practices, public.practice_images,
              public.time_records, public.meets, public.meet_results,
              public.best_times, public.monthly_distance
  from anon, authenticated;

-- アプリのサーバー（Secret key = service_role）には全権限を明示的に与える
grant select, insert, update, delete
  on public.strokes, public.pools, public.practices, public.practice_images,
     public.time_records, public.meets, public.meet_results
  to service_role;
grant select on public.best_times, public.monthly_distance to service_role;

-- 5. 種目マスタの初期データ（すでにあればスキップ）
insert into public.strokes (code, name, sort_order) values
  ('Fr',  '自由形',       1),
  ('Ba',  '背泳ぎ',       2),
  ('Br',  '平泳ぎ',       3),
  ('Fly', 'バタフライ',   4),
  ('IM',  '個人メドレー', 5)
on conflict (code) do nothing;
