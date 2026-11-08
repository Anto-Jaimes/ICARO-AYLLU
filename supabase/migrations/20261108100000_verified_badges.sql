-- "Celular verificado": a badge that only moderators give, from the panel, to a neighbour whose
-- phone they checked. It shows next to the author of their services, donations and news. It needs
-- the phone still verified by the call center: blocking the number (which removes it from
-- verified_phones) takes the badge away at once. AYLLU does not check DNI and never says so.

create table public.verified_badges (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  note text not null check (char_length(note) between 1 and 300),
  granted_at timestamptz not null default now()
);

alter table public.verified_badges enable row level security;

create policy verified_badges_select_team on public.verified_badges
  for select to authenticated
  using ((select public.is_moderator()));

grant select on public.verified_badges to authenticated;
grant select, insert, update, delete on public.verified_badges to service_role;

-- Whether an author shows the badge. Public by nature: it is shown on their posts.
create function public.has_verified_badge(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user is not null and exists (
    select 1
    from public.verified_badges b
    join public.verified_phones v on v.user_id = b.user_id
    where b.user_id = p_user
  );
$$;

revoke execute on function public.has_verified_badge(uuid) from public;
grant execute on function public.has_verified_badge(uuid) to anon, authenticated;

-- ---- The panel --------------------------------------------------------------------------------

-- A moderator looks an account up by the user code the neighbour gives them.
create function public.badge_lookup(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_code text;
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  select c.user_id, c.code into v_user, v_code
  from public.user_codes c
  where c.code = upper(btrim(coalesce(p_code, '')));
  if v_user is null then
    return jsonb_build_object('status', 'not_found');
  end if;
  return jsonb_build_object(
    'status', 'ok',
    'code', v_code,
    'phone', (select v.phone from public.verified_phones v where v.user_id = v_user),
    'posts', (select count(*) from public.posts p where p.author_id = v_user and p.status <> 'removed'),
    'reports', (select count(*) from public.reports r where r.author_id = v_user and r.status = 'published'),
    'removed', (select count(*) from public.posts p where p.author_id = v_user and p.status = 'removed')
      + (select count(*) from public.reports r where r.author_id = v_user and r.status = 'removed'),
    'badge', (select jsonb_build_object('note', b.note, 'granted_at', b.granted_at) from public.verified_badges b where b.user_id = v_user)
  );
end;
$$;

-- Gives (with how it was checked) or takes away the badge. Giving it needs a verified phone.
create function public.set_verified_badge(p_code text, p_grant boolean, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_code text;
  v_note text := btrim(coalesce(p_note, ''));
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  select c.user_id, c.code into v_user, v_code
  from public.user_codes c
  where c.code = upper(btrim(coalesce(p_code, '')));
  if v_user is null then
    return 'not_found';
  end if;

  if not p_grant then
    delete from public.verified_badges where user_id = v_user;
    perform public.log_moderation('badge_revoke', v_code, nullif(v_note, ''));
    return 'ok';
  end if;

  if not exists (select 1 from public.verified_phones where user_id = v_user) then
    return 'no_phone';
  end if;
  if v_note = '' then
    return 'no_note';
  end if;
  insert into public.verified_badges (user_id, granted_by, note)
  values (v_user, (select auth.uid()), left(v_note, 300))
  on conflict (user_id) do update set granted_by = excluded.granted_by, note = excluded.note, granted_at = now();
  perform public.log_moderation('badge_grant', v_code, v_note);
  return 'ok';
end;
$$;

-- The current badges, newest first, for the panel's list.
create function public.verified_badges_list()
returns table (code text, phone text, note text, granted_at timestamptz, granted_by text, active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.code, v.phone, b.note, b.granted_at, m.display_name, v.phone is not null
  from public.verified_badges b
  left join public.user_codes c on c.user_id = b.user_id
  left join public.verified_phones v on v.user_id = b.user_id
  left join public.moderators m on m.user_id = b.granted_by
  where public.is_moderator()
  order by b.granted_at desc;
$$;

revoke execute on function public.badge_lookup(text) from public, anon, authenticated;
revoke execute on function public.set_verified_badge(text, boolean, text) from public, anon, authenticated;
revoke execute on function public.verified_badges_list() from public, anon, authenticated;
grant execute on function public.badge_lookup(text) to authenticated;
grant execute on function public.set_verified_badge(text, boolean, text) to authenticated;
grant execute on function public.verified_badges_list() to authenticated;

-- ---- Where it shows: services, donations and news ------------------------------------------------

drop function public.nearby_posts(double precision, double precision, integer, integer);

create function public.nearby_posts(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 10000,
  p_limit integer default 200
)
returns table (
  id uuid,
  type text,
  category text,
  title text,
  description text,
  author_name text,
  author_phone text,
  neighborhood text,
  address text,
  lat double precision,
  lng double precision,
  price_info text,
  urgency_level text,
  status text,
  vistos_buenos integer,
  created_at timestamptz,
  is_mine boolean,
  has_user_voted boolean,
  reviews jsonb,
  photos text[],
  audience text,
  author_verified boolean
)
language sql
stable
set search_path = ''
as $$
  select
    p.id, p.type, p.category, p.title, p.description, p.author_name, p.author_phone,
    p.neighborhood, p.address, p.lat, p.lng, p.price_info, p.urgency_level, p.status,
    p.vistos_buenos, p.created_at,
    coalesce(p.author_id = (select auth.uid()), false),
    exists (
      select 1 from public.post_votes v
      where v.post_id = p.id and v.user_id = (select auth.uid())
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'author_name', r.author_name,
        'comment', r.comment,
        'is_neighbor_verified', r.is_neighbor_verified,
        'created_at', r.created_at
      ) order by r.created_at desc)
      from (
        select * from public.reviews x
        where x.post_id = p.id
        order by x.created_at desc
        limit 20
      ) r
    ), '[]'::jsonb),
    p.photos,
    p.audience,
    public.has_verified_badge(p.author_id)
  from public.posts p
  where p.status <> 'removed'
    and extensions.st_dwithin(
      p.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      least(p_radius_m, 50000)
    )
  order by p.created_at desc
  limit least(p_limit, 500);
$$;

revoke execute on function public.nearby_posts(double precision, double precision, integer, integer)
  from public, anon, authenticated;
grant execute on function public.nearby_posts(double precision, double precision, integer, integer)
  to anon, authenticated;

drop function public.reports_feed(text, text, text, integer);

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
  has_flagged boolean,
  lat double precision,
  lng double precision,
  comment_count integer,
  author_verified boolean
)
language sql
stable
set search_path = ''
as $$
  select
    r.id, r.kind, r.description, r.author_name, r.media_path, r.media_type,
    r.department, r.province, r.district, r.status, r.created_at,
    coalesce(r.author_id = (select auth.uid()), false),
    exists (select 1 from public.report_flags f where f.report_id = r.id and f.user_id = (select auth.uid())),
    round(r.lat::numeric, 3)::double precision,
    round(r.lng::numeric, 3)::double precision,
    (select count(*)::integer from public.report_comments c where c.report_id = r.id),
    public.has_verified_badge(r.author_id)
  from public.reports r
  where (p_department is null or r.department = p_department)
    and (p_province is null or r.province = p_province)
    and (p_district is null or r.district = p_district)
  order by r.created_at desc
  limit least(p_limit, 100);
$$;

revoke execute on function public.reports_feed(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.reports_feed(text, text, text, integer) to anon, authenticated;
