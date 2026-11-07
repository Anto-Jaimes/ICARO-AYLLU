-- Neighbour news: accidents, huaicos and damage, with a photo or video and an exact place.
--
-- Clients never choose whether something is public. Reports enter through create_report(),
-- which screens the text here on the server. The media verdict comes from the on-device
-- detector, so a modified client could lie about it: a report flagged by neighbours drops
-- back to review, and a server-side image check can replace that verdict later.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('accidente', 'huaico', 'inundacion', 'sismo', 'incendio', 'otro')),
  description text not null check (char_length(description) between 1 and 500),
  author_name text not null check (char_length(author_name) between 1 and 80),
  media_path text check (char_length(media_path) <= 200),
  media_type text check (media_type in ('image', 'video')),
  department text not null check (char_length(department) between 1 and 40),
  province text not null check (char_length(province) between 1 and 80),
  district text not null check (char_length(district) between 1 and 80),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  status text not null default 'review' check (status in ('review', 'published')),
  flags integer not null default 0 check (flags >= 0),
  created_at timestamptz not null default now()
);

create index reports_place_idx on public.reports (department, province, district, created_at desc);
create index reports_author_idx on public.reports (author_id, created_at desc);

alter table public.reports enable row level security;

create policy reports_select_visible on public.reports
  for select to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()));

grant select on public.reports to anon, authenticated;
grant select, insert, update, delete on public.reports to service_role;

create table public.report_flags (
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index report_flags_user_idx on public.report_flags (user_id);

alter table public.report_flags enable row level security;

create policy report_flags_select_own on public.report_flags
  for select to anon, authenticated
  using (user_id = (select auth.uid()));

grant select on public.report_flags to anon, authenticated;

-- Photos and videos. Paths start with the author's id, so nobody can overwrite another
-- neighbour's file, and random names keep unpublished files out of reach in practice.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/3gpp', 'video/quicktime']
)
on conflict (id) do nothing;

create policy reports_upload_own_folder on storage.objects
  for insert to authenticated
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy reports_delete_own_files on storage.objects
  for delete to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Definer so that nobody can write status directly. Returns what happened, for the screen.
create function public.create_report(
  p_kind text,
  p_description text,
  p_author_name text,
  p_department text,
  p_province text,
  p_district text,
  p_lat double precision,
  p_lng double precision,
  p_media_path text default null,
  p_media_type text default null,
  p_media_check text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_status text := 'published';
  v_recent integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select count(*) into v_recent
  from public.reports
  where author_id = v_user_id and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    return jsonb_build_object('status', 'rejected', 'reason', 'too_many');
  end if;

  -- News is for what is happening, not for selling: that belongs in Servicios.
  if p_description ~* '(s/\.?\s*\d|\m(ofertas?|promoci[oó]n|promos?|descuentos?|vendo|ventas?|precios?|delivery|cont[aá]ctame|cont[aá]ctanos|whatsapp|wsp|escr[ií]beme|s[ií]guenos|mi negocio|mi tienda|cotiza|remate|liquidaci[oó]n)\M|https?://|www\.|\m9\d{2}[ -]?\d{3}[ -]?\d{3}\M)' then
    return jsonb_build_object('status', 'rejected', 'reason', 'advertising');
  end if;

  if p_media_path is not null then
    if split_part(p_media_path, '/', 1) <> v_user_id::text then
      raise exception 'invalid media path' using errcode = '42501';
    end if;
    -- Anything but an explicit clean result waits for a person.
    if p_media_check is distinct from 'clean' then
      v_status := 'review';
    end if;
  end if;

  insert into public.reports (
    author_id, kind, description, author_name, media_path, media_type,
    department, province, district, lat, lng, status
  )
  values (
    v_user_id, p_kind, p_description, p_author_name, p_media_path, p_media_type,
    p_department, p_province, p_district, p_lat, p_lng, v_status
  );

  return jsonb_build_object('status', v_status);
end;
$$;

revoke execute on function public.create_report(text, text, text, text, text, text, double precision, double precision, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_report(text, text, text, text, text, text, double precision, double precision, text, text, text)
  to authenticated;

-- Three different neighbours are enough to hide a report until someone reviews it.
create function public.flag_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.report_flags (report_id, user_id)
  values (p_report_id, v_user_id)
  on conflict do nothing;

  if found then
    update public.reports
    set flags = flags + 1,
        status = case when flags + 1 >= 3 then 'review' else status end
    where id = p_report_id;
  end if;
end;
$$;

revoke execute on function public.flag_report(uuid) from public, anon, authenticated;
grant execute on function public.flag_report(uuid) to authenticated;

create function public.reports_feed(
  p_department text default null,
  p_province text default null,
  p_district text default null,
  p_limit integer default 30
)
returns table (
  id uuid,
  kind text,
  description text,
  author_name text,
  media_path text,
  media_type text,
  department text,
  province text,
  district text,
  status text,
  created_at timestamptz,
  is_mine boolean,
  has_flagged boolean
)
language sql
stable
set search_path = ''
as $$
  select
    r.id, r.kind, r.description, r.author_name, r.media_path, r.media_type,
    r.department, r.province, r.district, r.status, r.created_at,
    coalesce(r.author_id = (select auth.uid()), false),
    exists (select 1 from public.report_flags f where f.report_id = r.id and f.user_id = (select auth.uid()))
  from public.reports r
  where (p_department is null or r.department = p_department)
    and (p_province is null or r.province = p_province)
    and (p_district is null or r.district = p_district)
  order by r.created_at desc
  limit least(p_limit, 100);
$$;

revoke execute on function public.reports_feed(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.reports_feed(text, text, text, integer) to anon, authenticated;

alter publication supabase_realtime add table public.reports;
