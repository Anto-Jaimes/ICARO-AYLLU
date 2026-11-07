-- Moderation: the team members who review neighbour news and free calls from the web panel
-- (/moderacion), and the public page where anyone who got an AYLLU call can complain
-- (/denuncia). Being a moderator is a row in a table only the secret key can write, so it can be
-- taken away at once and the app itself can never grant it.

create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.moderators enable row level security;
grant select, insert, update, delete on public.moderators to service_role;

create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.moderators where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_moderator() from public, anon;
grant execute on function public.is_moderator() to authenticated;

-- Moderators see each other, so the log shows who did what.
create policy moderators_select_team on public.moderators
  for select to authenticated
  using ((select public.is_moderator()));

grant select on public.moderators to authenticated;

create function public.password_changed()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.moderators set must_change_password = false where user_id = (select auth.uid());
$$;

revoke execute on function public.password_changed() from public, anon, authenticated;
grant execute on function public.password_changed() to authenticated;

-- Every decision is written down with who took it.
create table public.moderation_log (
  id bigint generated always as identity primary key,
  moderator_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) between 1 and 40),
  target_id text check (char_length(target_id) <= 60),
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);

create index moderation_log_created_idx on public.moderation_log (created_at desc);
alter table public.moderation_log enable row level security;

create policy moderation_log_select_team on public.moderation_log
  for select to authenticated
  using ((select public.is_moderator()));

grant select on public.moderation_log to authenticated;
grant select, insert, update, delete on public.moderation_log to service_role;

create function public.log_moderation(p_action text, p_target text, p_note text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderation_log (moderator_id, action, target_id, note)
  values ((select auth.uid()), p_action, p_target, left(p_note, 300));
$$;

revoke execute on function public.log_moderation(text, text, text) from public, anon, authenticated;

-- ---- News -------------------------------------------------------------------------------------

alter table public.reports drop constraint reports_status_check;
alter table public.reports add constraint reports_status_check check (status in ('review', 'published', 'removed'));

create policy reports_select_moderators on public.reports
  for select to authenticated
  using ((select public.is_moderator()));

create index reports_review_idx on public.reports (created_at desc) where status = 'review';

-- Publishing again clears the flags, so it takes three new neighbours to hide it once more.
-- Removing keeps the row as evidence; the panel deletes the photo or video first.
create function public.moderate_report(p_report_id uuid, p_action text)
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
    delete from public.report_flags where report_id = p_report_id;
  else
    update public.reports set status = 'removed', media_path = null, media_type = null where id = p_report_id;
  end if;

  if not found then
    return 'not_found';
  end if;
  perform public.log_moderation('report_' || p_action, p_report_id::text);
  return 'ok';
end;
$$;

revoke execute on function public.moderate_report(uuid, text) from public, anon, authenticated;
grant execute on function public.moderate_report(uuid, text) to authenticated;

create policy reports_media_moderators_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'reports' and (select public.is_moderator()));

-- ---- Calls ------------------------------------------------------------------------------------

create policy call_requests_select_moderators on public.call_requests
  for select to authenticated
  using ((select public.is_moderator()));

create policy call_recordings_moderators_read on storage.objects
  for select to authenticated
  using (bucket_id = 'call-recordings' and (select public.is_moderator()));

-- A complaint keeps the recording beyond 30 days.
create function public.set_call_complaint(p_call_id uuid, p_has_complaint boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  update public.call_requests set has_complaint = p_has_complaint where id = p_call_id;
  perform public.log_moderation(case when p_has_complaint then 'call_mark' else 'call_unmark' end, p_call_id::text);
end;
$$;

revoke execute on function public.set_call_complaint(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_call_complaint(uuid, boolean) to authenticated;

-- A blocked phone can no longer verify itself or ask for calls.
create table public.blocked_phones (
  phone text primary key check (phone ~ '^9[0-9]{8}$'),
  reason text not null check (char_length(reason) between 1 and 300),
  blocked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.blocked_phones enable row level security;

create policy blocked_phones_select_team on public.blocked_phones
  for select to authenticated
  using ((select public.is_moderator()));

grant select on public.blocked_phones to authenticated;
grant select, insert, update, delete on public.blocked_phones to service_role;

create function public.block_phone(p_phone text, p_reason text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  if v_phone ~ '^519[0-9]{8}$' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^9[0-9]{8}$' or v_reason = '' then
    return 'invalid';
  end if;

  insert into public.blocked_phones (phone, reason, blocked_by)
  values (v_phone, left(v_reason, 300), (select auth.uid()))
  on conflict (phone) do update set reason = excluded.reason, blocked_by = excluded.blocked_by, created_at = now();
  delete from public.verified_phones where phone = v_phone;
  perform public.log_moderation('phone_block', v_phone, v_reason);
  return 'ok';
end;
$$;

revoke execute on function public.block_phone(text, text) from public, anon, authenticated;
grant execute on function public.block_phone(text, text) to authenticated;

create function public.unblock_phone(p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  delete from public.blocked_phones where phone = p_phone;
  perform public.log_moderation('phone_unblock', p_phone);
end;
$$;

revoke execute on function public.unblock_phone(text) from public, anon, authenticated;
grant execute on function public.unblock_phone(text) to authenticated;

-- ---- Complaints from whoever received a call ------------------------------------------------------

create table public.call_complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  -- The number that received the call.
  phone text not null check (phone ~ '^9[0-9]{8}$'),
  heard_code text check (heard_code ~ '^[A-Z0-9]{4,10}$'),
  called_at timestamptz not null,
  description text not null check (char_length(description) between 5 and 1000),
  call_id uuid references public.call_requests (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index call_complaints_created_idx on public.call_complaints (created_at desc);
create index call_complaints_reporter_idx on public.call_complaints (reporter_id, created_at desc);
create index call_complaints_call_idx on public.call_complaints (call_id);

alter table public.call_complaints enable row level security;

create policy call_complaints_select_team on public.call_complaints
  for select to authenticated
  using ((select public.is_moderator()));

grant select on public.call_complaints to authenticated;
grant select, insert, update, delete on public.call_complaints to service_role;

-- Answers 'ok', 'invalid' or 'too_many'. It never says whether a call was found, so nobody can
-- use it to learn who called whom. A matching call keeps its recording.
create function public.submit_call_complaint(p_phone text, p_called_at timestamptz, p_code text, p_description text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_code text := nullif(upper(btrim(coalesce(p_code, ''))), '');
  v_description text := btrim(coalesce(p_description, ''));
  v_call_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_phone ~ '^519[0-9]{8}$' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^9[0-9]{8}$'
     or char_length(v_description) not between 5 and 1000
     or p_called_at is null
     or (v_code is not null and v_code !~ '^[A-Z0-9]{4,10}$') then
    return 'invalid';
  end if;

  if (select count(*) from public.call_complaints where reporter_id = v_user_id and created_at > now() - interval '1 day') >= 3 then
    return 'too_many';
  end if;

  select id into v_call_id
  from public.call_requests
  where destination = v_phone
    and created_at between p_called_at - interval '1 day' and p_called_at + interval '1 day'
    and (v_code is null or user_code = v_code)
  order by abs(extract(epoch from created_at - p_called_at))
  limit 1;

  insert into public.call_complaints (reporter_id, phone, heard_code, called_at, description, call_id)
  values (v_user_id, v_phone, v_code, p_called_at, v_description, v_call_id);

  if v_call_id is not null then
    update public.call_requests set has_complaint = true where id = v_call_id;
  end if;
  return 'ok';
end;
$$;

revoke execute on function public.submit_call_complaint(text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.submit_call_complaint(text, timestamptz, text, text) to authenticated;

create function public.review_complaint(p_complaint_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  if p_status not in ('new', 'reviewed', 'dismissed') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  update public.call_complaints set status = p_status where id = p_complaint_id;
  perform public.log_moderation('complaint_' || p_status, p_complaint_id::text);
end;
$$;

revoke execute on function public.review_complaint(uuid, text) from public, anon, authenticated;
grant execute on function public.review_complaint(uuid, text) to authenticated;

-- ---- Blocked phones cannot verify or call ----------------------------------------------------------

create or replace function public.start_phone_verification(p_phone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_day_start timestamptz := public.lima_day_start();
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_phone ~ '^519[0-9]{8}$' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^9[0-9]{8}$' then
    return 'invalid';
  end if;
  if exists (select 1 from public.blocked_phones where phone = v_phone) then
    return 'blocked';
  end if;

  if (select count(*) from public.phone_verifications where user_id = v_user_id and created_at >= v_day_start) >= 3
     or (select count(*) from public.phone_verifications where phone = v_phone and created_at >= v_day_start) >= 3 then
    return 'too_many';
  end if;

  update public.phone_verifications
  set status = 'failed'
  where user_id = v_user_id and status = 'pending';

  insert into public.phone_verifications (user_id, phone, code)
  values (
    v_user_id,
    v_phone,
    lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 10000)::text, 4, '0')
  );
  return 'ok';
end;
$$;

create or replace function public.request_call(
  p_destination text,
  p_lat double precision default null,
  p_lng double precision default null,
  p_place text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_destination text := regexp_replace(coalesce(p_destination, ''), '[^0-9]', '', 'g');
  v_day_start timestamptz := public.lima_day_start();
  v_phone text;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_destination ~ '^519[0-9]{8}$' then
    v_destination := substr(v_destination, 3);
  end if;
  if v_destination !~ '^9[0-9]{8}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select phone into v_phone from public.verified_phones where user_id = v_user_id;
  if v_phone is null then
    return jsonb_build_object('status', 'no_phone');
  end if;
  if exists (select 1 from public.blocked_phones where phone = v_phone) then
    return jsonb_build_object('status', 'blocked');
  end if;
  if v_destination = v_phone then
    return jsonb_build_object('status', 'same_number');
  end if;

  if exists (
    select 1 from public.call_requests
    where (user_id = v_user_id or caller_phone = v_phone)
      and status in ('pending', 'calling_caller', 'calling_destination', 'connected')
  ) then
    return jsonb_build_object('status', 'busy');
  end if;

  if exists (
    select 1 from public.call_requests
    where (user_id = v_user_id or caller_phone = v_phone)
      and created_at >= v_day_start
      and status in ('connected', 'completed')
  ) then
    return jsonb_build_object('status', 'used_today');
  end if;

  if (
    select count(*) from public.call_requests
    where (user_id = v_user_id or caller_phone = v_phone) and created_at >= v_day_start
  ) >= 3 then
    return jsonb_build_object('status', 'too_many');
  end if;

  insert into public.call_requests (user_id, user_code, caller_phone, destination, caller_lat, caller_lng, caller_place)
  values (v_user_id, public.my_user_code(), v_phone, v_destination, p_lat, p_lng, left(p_place, 200))
  returning id into v_id;

  return jsonb_build_object('status', 'ok', 'id', v_id);
end;
$$;
