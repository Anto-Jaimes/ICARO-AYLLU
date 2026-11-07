-- Refreshes IGP earthquakes every 5 minutes. The publishable key is public by design:
-- it only lets pg_cron through the function's authentication.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'ingest-igp',
  '*/5 * * * *',
  $job$ select net.http_post(
       url := 'https://kykovntngvtvhabcpvih.supabase.co/functions/v1/ingest-hazards',
       headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_Y0o-4nefOyE_p5LiTwGDFQ_NsZo4jpH", "Authorization": "Bearer sb_publishable_Y0o-4nefOyE_p5LiTwGDFQ_NsZo4jpH"}'::jsonb,
       timeout_milliseconds := 60000
     ) $job$
);
