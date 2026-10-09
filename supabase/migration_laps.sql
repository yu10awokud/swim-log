-- =====================================================================
-- ラップ（50m ごと・任意）を保存できるようにする変更
--
-- 使い方：Supabase → SQL Editor → New query に全部貼り付けて「Run」（1回だけ）。
--         データは消えません。何度実行しても安全です。
-- =====================================================================
alter table public.time_records add column if not exists laps_cs int[];
alter table public.meet_results add column if not exists laps_cs int[];
