-- Sends phone notifications every minute: a quake is only useful news while it is fresh.
-- Same call as ingest-igp: the publishable key is public by design and only lets pg_cron through the
-- function's authentication; the function itself can only send what the database already queued.
select cron.schedule(
  'send-pushes',
  '* * * * *',
  $job$ select net.http_post(
       url := 'https://kykovntngvtvhabcpvih.supabase.co/functions/v1/send-pushes',
       headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_Y0o-4nefOyE_p5LiTwGDFQ_NsZo4jpH", "Authorization": "Bearer sb_publishable_Y0o-4nefOyE_p5LiTwGDFQ_NsZo4jpH"}'::jsonb,
       timeout_milliseconds := 55000
     ) $job$
);
