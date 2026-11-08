-- The strong news that was already published goes back to review, as the team asked on
-- 2026-11-08: it leaves the home screen until a moderator approves it from the panel.
-- At the time of writing this was two reports (the shooting in Pamplona Alta, both with video).
update public.reports
set status = 'review'
where status = 'published'
  and public.is_strong_report(kind, description, media_path is not null);
