-- ICARO-AYLLU: neighbour posts, Visto Bueno votes and recommendations.
--
-- This project does not expose new tables automatically, so every grant below is
-- deliberate. Clients never write counters, flags or author ids: those are set by
-- defaults, triggers and functions, so they cannot be forged from the browser.

create extension if not exists postgis with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------

create table public.posts (
  -- The client generates the id so a retried offline post cannot be duplicated.
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  type text not null check (type in (
    'service', 'favor_offer', 'favor_request',
    'emergency_need', 'emergency_resource', 'support_group'
  )),
  category text not null check (char_length(category) between 1 and 40),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_phone text check (author_phone ~ '^\+?[0-9]{6,15}$'),
  neighborhood text not null check (char_length(neighborhood) between 1 and 160),
  address text check (char_length(address) <= 200),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
  ) stored,
  price_info text check (char_length(price_info) <= 120),
  urgency_level text check (urgency_level in ('baja', 'media', 'alta', 'critica')),
  status text not null default 'active' check (status in ('active', 'in_progress', 'resolved')),
  vistos_buenos integer not null default 0 check (vistos_buenos >= 0),
  -- Sample content: "delete from public.posts where is_demo" removes all of it.
  is_demo boolean not null default false,
  status_updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_location_idx on public.posts using gist (location);
create index posts_author_id_idx on public.posts (author_id);

alter table public.posts enable row level security;

create policy posts_select_all on public.posts
  for select to anon, authenticated
  using (true);

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()));

-- Any neighbour may update an emergency, because whoever attends it may not be
-- the author (who could be trapped). Everything else belongs to its author.
-- posts_track_status records who made each change.
create policy posts_update_status on public.posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    or type in ('emergency_need', 'emergency_resource', 'support_group')
  )
  with check (
    author_id = (select auth.uid())
    or type in ('emergency_need', 'emergency_resource', 'support_group')
  );

grant select on public.posts to anon, authenticated;
grant insert (
  id, type, category, title, description, author_name, author_phone,
  neighborhood, address, lat, lng, price_info, urgency_level
) on public.posts to authenticated;
grant update (status) on public.posts to authenticated;

create function private.track_post_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.status_updated_by := auth.uid();
  return new;
end;
$$;

create trigger posts_track_status
  before update of status on public.posts
  for each row execute function private.track_post_status();

-- ---------------------------------------------------------------------------
-- Visto Bueno votes
-- ---------------------------------------------------------------------------

create table public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_votes_user_id_idx on public.post_votes (user_id);

alter table public.post_votes enable row level security;

create policy post_votes_select_own on public.post_votes
  for select to authenticated
  using (user_id = (select auth.uid()));

-- A Visto Bueno only means something when it comes from someone else.
create policy post_votes_insert_own on public.post_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

create policy post_votes_delete_own on public.post_votes
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.post_votes to authenticated;
grant insert (post_id) on public.post_votes to authenticated;

-- Definer: voters may not update posts, but the counter has to follow their vote.
create function private.sync_vistos_buenos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set vistos_buenos = vistos_buenos + 1 where id = new.post_id;
  else
    update public.posts set vistos_buenos = greatest(vistos_buenos - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger post_votes_sync_count
  after insert or delete on public.post_votes
  for each row execute function private.sync_vistos_buenos();

-- ---------------------------------------------------------------------------
-- Recommendations
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null check (char_length(author_name) between 1 and 80),
  comment text not null check (char_length(comment) between 1 and 1000),
  is_neighbor_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- One recommendation per neighbour and post. Demo rows have a null author.
create unique index reviews_post_author_key on public.reviews (post_id, author_id);
create index reviews_post_created_idx on public.reviews (post_id, created_at desc);
create index reviews_author_id_idx on public.reviews (author_id);

alter table public.reviews enable row level security;

create policy reviews_select_all on public.reviews
  for select to anon, authenticated
  using (true);

-- No insert grant: recommendations are written only through add_review().
grant select on public.reviews to anon, authenticated;

-- ---------------------------------------------------------------------------
-- API functions
-- ---------------------------------------------------------------------------

-- Posts around a point, with the caller's vote and the latest recommendations,
-- in a single round trip.
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
  reviews jsonb
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
    ), '[]'::jsonb)
  from public.posts p
  where extensions.st_dwithin(
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

-- Saves a recommendation and its Visto Bueno atomically. Definer so that
-- is_neighbor_verified is decided here: a neighbour counts as verified when they
-- recommend from within 3 km of the post (the app's "Zona" radius).
create function public.add_review(
  p_post_id uuid,
  p_author_name text,
  p_comment text,
  p_lat double precision default null,
  p_lng double precision default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_post public.posts;
  v_verified boolean := false;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_post from public.posts where id = p_post_id;
  if not found then
    raise exception 'post not found' using errcode = 'P0002';
  end if;

  if v_post.author_id = v_user_id then
    raise exception 'cannot recommend your own post' using errcode = '42501';
  end if;

  if p_lat is not null and p_lng is not null then
    v_verified := extensions.st_dwithin(
      v_post.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      3000
    );
  end if;

  insert into public.reviews (post_id, author_id, author_name, comment, is_neighbor_verified)
  values (p_post_id, v_user_id, p_author_name, p_comment, v_verified)
  on conflict (post_id, author_id) do update
    set author_name = excluded.author_name,
        comment = excluded.comment,
        is_neighbor_verified = excluded.is_neighbor_verified,
        created_at = now();

  insert into public.post_votes (post_id, user_id)
  values (p_post_id, v_user_id)
  on conflict do nothing;
end;
$$;

revoke execute on function public.add_review(uuid, text, text, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.add_review(uuid, text, text, double precision, double precision)
  to authenticated;

-- Live updates: a post from one neighbour appears on the others' screens.
alter publication supabase_realtime add table public.posts, public.reviews;
