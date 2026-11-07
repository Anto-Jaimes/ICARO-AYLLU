-- moderate_report checked FOUND after clearing the flags, so publishing a report without flags
-- answered 'not_found' and skipped the log. Check right after the report itself changes.
create or replace function public.moderate_report(p_report_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  if p_action not in ('publish', 'remove') then
    return 'invalid';
  end if;

  if p_action = 'publish' then
    update public.reports set status = 'published', flags = 0 where id = p_report_id;
    if not found then
      return 'not_found';
    end if;
    delete from public.report_flags where report_id = p_report_id;
  else
    update public.reports set status = 'removed', media_path = null, media_type = null where id = p_report_id;
    if not found then
      return 'not_found';
    end if;
  end if;

  perform public.log_moderation('report_' || p_action, p_report_id::text);
  return 'ok';
end;
$$;
