-- Storage deletes an object only when the caller may also read it through the API. Without this,
-- removing a report's photo answered "0 files deleted" with no error and the file stayed public.
create policy reports_media_moderators_read on storage.objects
  for select to authenticated
  using (bucket_id = 'reports' and (select public.is_moderator()));
