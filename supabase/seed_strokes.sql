-- =====================================================================
-- 種目マスタの初期データ
--
-- 使い方：Supabase で「自分のログインアカウント」を作成した【あと】に、
--         SQL Editor でこのファイルの中身を貼り付けて「Run」を押します（1回だけ）。
--         すでに同じ略称の種目がある場合はスキップされるので、2回実行しても安全です。
-- =====================================================================
insert into public.strokes (user_id, code, name, sort_order)
select u.id, s.code, s.name, s.sort_order
from auth.users u
cross join (values
  ('Fr',  '自由形',       1),
  ('Ba',  '背泳ぎ',       2),
  ('Br',  '平泳ぎ',       3),
  ('Fly', 'バタフライ',   4),
  ('IM',  '個人メドレー', 5)
) as s (code, name, sort_order)
on conflict (user_id, code) do nothing;
