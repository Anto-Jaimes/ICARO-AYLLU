-- Notifications on the phone (Firebase Cloud Messaging), even with the app closed:
--   * a strong IGP quake near the phone (4.5 or more; farther the stronger it is),
--   * a possible tsunami (the app's own estimate) for phones on the coast,
--   * a SENAMHI rain or mudslide zone, orange or red, that includes the phone,
--   * a comment on the neighbour's own news,
--   * and a test the neighbour asks for, to see how they arrive.
--
-- The app registers its phone with a location rounded to about 1 km (the zone, never the house).
-- The database decides who gets what and leaves it in push_queue; the send-pushes function, called
-- by pg_cron every minute, writes the words in the phone's language and hands them to Firebase.

create table public.push_devices (
  token text primary key check (char_length(token) between 20 and 4096),
  user_id uuid references auth.users (id) on delete set null,
  lang text not null default 'es' check (lang in ('es', 'en', 'qu', 'ay')),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
    end
  ) stored,
  updated_at timestamptz not null default now()
);

create index push_devices_location_idx on public.push_devices using gist (location);
create index push_devices_user_idx on public.push_devices (user_id);

create table public.push_queue (
  id bigint generated always as identity primary key,
  token text not null references public.push_devices (token) on delete cascade,
  kind text not null check (kind in ('quake', 'tsunami', 'zone', 'comment', 'test')),
  params jsonb not null default '{}',
  created_at timestamptz not null default now(),
  attempts smallint not null default 0,
  claimed_at timestamptz,
  sent_at timestamptz,
  error text
);

create index push_queue_pending_idx on public.push_queue (id) where sent_at is null;
create index push_queue_token_kind_idx on public.push_queue (token, kind, created_at desc);

-- One notice per quake (and per tsunami estimate): the next minute does not repeat it.
create table public.push_events_done (
  event_key text primary key,
  devices integer not null,
  done_at timestamptz not null default now()
);

-- One notice per phone and SENAMHI bulletin: a phone that arrives later in the day still gets it.
create table public.push_zone_sent (
  token text not null references public.push_devices (token) on delete cascade,
  batch_id uuid not null,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (token, batch_id, kind)
);

-- Nobody reads these from the app: only the functions below and the sender.
alter table public.push_devices enable row level security;
alter table public.push_queue enable row level security;
alter table public.push_events_done enable row level security;
alter table public.push_zone_sent enable row level security;

grant select, insert, update, delete on public.push_devices, public.push_queue, public.push_events_done, public.push_zone_sent to service_role;

-- ---------------------------------------------------------------------------
-- What the app calls
-- ---------------------------------------------------------------------------

-- Registers (or refreshes) this phone. Without a location it keeps the last one it had.
create function public.register_push_device(p_token text, p_lat double precision, p_lng double precision, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_has_place boolean := p_lat between -90 and 90 and p_lng between -180 and 180;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(coalesce(p_token, '')) not between 20 and 4096 then
    raise exception 'invalid token' using errcode = '22023';
  end if;

  insert into public.push_devices (token, user_id, lang, lat, lng, updated_at)
  values (
    p_token,
    v_user,
    case when p_lang in ('es', 'en', 'qu', 'ay') then p_lang else 'es' end,
    case when v_has_place then round(p_lat::numeric, 2)::double precision end,
    case when v_has_place then round(p_lng::numeric, 2)::double precision end,
    now()
  )
  on conflict (token) do update set
    user_id = excluded.user_id,
    lang = excluded.lang,
    lat = coalesce(excluded.lat, public.push_devices.lat),
    lng = coalesce(excluded.lng, public.push_devices.lng),
    updated_at = now();
end;
$$;

-- On "Cerrar sesión": the phone keeps the zone alerts, but no longer the account's comments.
create function public.forget_push_account(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.push_devices set user_id = null
  where token = p_token and user_id = (select auth.uid());
$$;

-- "Desactivar avisos": the token itself is the proof that it is this phone.
create function public.remove_push_device(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_devices where token = p_token;
$$;

-- "Enviar un aviso de prueba" to this phone, at most 3 an hour.
create function public.request_test_push(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.push_devices where token = p_token and user_id = (select auth.uid())) then
    return 'no_device';
  end if;
  if (select count(*) from public.push_queue
      where token = p_token and kind = 'test' and created_at > now() - interval '1 hour') >= 3 then
    return 'too_many';
  end if;
  insert into public.push_queue (token, kind) values (p_token, 'test');
  return 'ok';
end;
$$;

revoke all on function public.register_push_device(text, double precision, double precision, text) from public, anon;
revoke all on function public.forget_push_account(text) from public, anon;
revoke all on function public.request_test_push(text) from public, anon;
revoke all on function public.remove_push_device(text) from public;
grant execute on function public.register_push_device(text, double precision, double precision, text) to authenticated;
grant execute on function public.forget_push_account(text) to authenticated;
grant execute on function public.request_test_push(text) to authenticated;
-- Turning the alerts off also works after signing out.
grant execute on function public.remove_push_device(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Who gets each notice (also called by the tests with made-up places)
-- ---------------------------------------------------------------------------

-- Strong quakes are felt far: 150 km from 4.5, 400 km from 6, 800 km from 7.
create function public.push_recipients_quake(p_lat double precision, p_lng double precision, p_magnitude numeric)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select d.token
  from public.push_devices d
  where p_magnitude >= 4.5
    and d.location is not null
    and extensions.st_dwithin(
      d.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      case when p_magnitude >= 7 then 800000 when p_magnitude >= 6 then 400000 else 150000 end
    );
$$;

-- Same rule as the app (src/services/tsunamiService.ts): 7 or more, at sea off Peru and shallow.
-- Only phones on SENAMHI's coast regions, up to 1000 km away.
create function public.push_recipients_tsunami(p_lat double precision, p_lng double precision, p_magnitude numeric, p_depth_km integer)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select d.token
  from public.push_devices d
  where p_magnitude >= 7
    and p_lng <= -75 and p_lat between -19.5 and 0 and p_depth_km <= 70
    and d.location is not null
    and extensions.st_dwithin(
      d.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      1000000
    )
    and exists (
      select 1 from public.macro_regions m
      where m.name like 'Costa %'
        and extensions.st_intersects(m.geom, d.location::extensions.geometry)
    );
$$;

-- Fills the queue with what happened since the last minute. Called by send-pushes.
create function public.queue_hazard_pushes()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quake record;
  v_batch record;
  v_count integer;
  v_quakes integer := 0;
  v_tsunamis integer := 0;
  v_zones integer := 0;
begin
  -- IGP publishes some minutes late; only fresh quakes ring (a history reload never does).
  for v_quake in
    select e.id, e.magnitude, e.depth_km, e.lat, e.lng, e.detail
    from public.hazard_events e
    where e.source = 'IGP' and e.magnitude >= 4.5 and e.lat is not null and e.lng is not null
      and e.occurred_at > now() - interval '90 minutes'
      and not exists (select 1 from public.push_events_done x where x.event_key = 'quake:' || e.id)
  loop
    insert into public.push_queue (token, kind, params)
    select r.token, 'quake', jsonb_build_object('magnitude', v_quake.magnitude, 'detail', v_quake.detail)
    from public.push_recipients_quake(v_quake.lat, v_quake.lng, v_quake.magnitude) as r(token);
    get diagnostics v_count = row_count;
    insert into public.push_events_done (event_key, devices) values ('quake:' || v_quake.id, v_count);
    v_quakes := v_quakes + v_count;

    insert into public.push_queue (token, kind, params)
    select r.token, 'tsunami', jsonb_build_object('magnitude', v_quake.magnitude)
    from public.push_recipients_tsunami(v_quake.lat, v_quake.lng, v_quake.magnitude, v_quake.depth_km) as r(token);
    get diagnostics v_count = row_count;
    if v_count > 0 then
      insert into public.push_events_done (event_key, devices) values ('tsunami:' || v_quake.id, v_count);
      v_tsunamis := v_tsunamis + v_count;
    end if;
  end loop;

  -- The latest SENAMHI bulletin of each kind, orange (3) or red (4), for phones inside it.
  for v_batch in
    select distinct on (z.kind) z.kind, z.batch_id
    from public.hazard_zones z
    where z.issued_on >= current_date - 1
    order by z.kind, z.issued_on desc, z.id desc
  loop
    with hits as (
      select distinct on (d.token) d.token, z.level, z.district
      from public.push_devices d
      join public.hazard_zones z
        on z.batch_id = v_batch.batch_id and z.kind = v_batch.kind and z.level >= 3
       and extensions.st_intersects(z.geom, d.location::extensions.geometry)
      where d.location is not null
        and not exists (
          select 1 from public.push_zone_sent s
          where s.token = d.token and s.batch_id = v_batch.batch_id and s.kind = v_batch.kind
        )
      order by d.token, z.level desc
    ),
    marked as (
      insert into public.push_zone_sent (token, batch_id, kind)
      select token, v_batch.batch_id, v_batch.kind from hits
      returning token
    )
    insert into public.push_queue (token, kind, params)
    select h.token, 'zone', jsonb_build_object('hazard', v_batch.kind, 'level', h.level, 'district', h.district)
    from hits h;
    get diagnostics v_count = row_count;
    v_zones := v_zones + v_count;
  end loop;

  return jsonb_build_object('quake', v_quakes, 'tsunami', v_tsunamis, 'zone', v_zones);
end;
$$;

-- Hands the next notices to the sender. Made-up test phones (TEST-...) are never sent to Firebase.
create function public.claim_push_queue(p_limit integer default 300)
returns table (id bigint, token text, lang text, kind text, params jsonb)
language sql
security definer
set search_path = ''
as $$
  with next as (
    select q.id
    from public.push_queue q
    where q.sent_at is null
      and q.attempts < 3
      and q.token not like 'TEST-%'
      and (q.claimed_at is null or q.claimed_at < now() - interval '5 minutes')
    order by q.id
    limit least(greatest(p_limit, 1), 1000)
    for update skip locked
  ),
  claimed as (
    update public.push_queue q
    set claimed_at = now(), attempts = q.attempts + 1
    from next
    where q.id = next.id
    returning q.id, q.token, q.kind, q.params
  )
  select c.id, c.token, d.lang, c.kind, c.params
  from claimed c
  join public.push_devices d on d.token = c.token;
$$;

-- Old history is not needed: a day of sent notices is enough to explain a complaint.
create function public.prune_push_queue()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_queue where created_at < now() - interval '2 days';
  delete from public.push_events_done where done_at < now() - interval '7 days';
  delete from public.push_zone_sent where sent_at < now() - interval '3 days';
$$;

revoke all on function public.push_recipients_quake(double precision, double precision, numeric) from public, anon, authenticated;
revoke all on function public.push_recipients_tsunami(double precision, double precision, numeric, integer) from public, anon, authenticated;
revoke all on function public.queue_hazard_pushes() from public, anon, authenticated;
revoke all on function public.claim_push_queue(integer) from public, anon, authenticated;
revoke all on function public.prune_push_queue() from public, anon, authenticated;
grant execute on function public.push_recipients_quake(double precision, double precision, numeric) to service_role;
grant execute on function public.push_recipients_tsunami(double precision, double precision, numeric, integer) to service_role;
grant execute on function public.queue_hazard_pushes() to service_role;
grant execute on function public.claim_push_queue(integer) to service_role;
grant execute on function public.prune_push_queue() to service_role;

-- ---------------------------------------------------------------------------
-- A comment on your news
-- ---------------------------------------------------------------------------

create function private.queue_comment_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.push_queue (token, kind, params)
  select d.token, 'comment', jsonb_build_object(
    'report_id', new.report_id,
    'name', left(new.author_name, 40),
    'body', left(new.body, 140)
  )
  from public.reports r
  join public.push_devices d on d.user_id = r.author_id
  where r.id = new.report_id
    and r.author_id is distinct from new.author_id;
  return new;
end;
$$;

create trigger report_comments_push
after insert on public.report_comments
for each row execute function private.queue_comment_push();
