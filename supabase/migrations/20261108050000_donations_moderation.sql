-- Donations and moderation of services, donations and news comments.
--
-- "Favores" become "Donaciones": in real life a neighbour gives something away (what, where to pick it
-- up, a description), to any neighbour or to an organisation (comedor, olla común, albergue). The post
-- types stay favor_offer / favor_request so older posts keep working; what changes is who receives.
--
-- Moderators can now remove a service or a donation (it stays in the table, hidden, and its author
-- cannot bring it back), and remove news comments. Neighbours with a user code can report a post.

alter table public.posts
  add column audience text check (audience in ('vecinos', 'organizacion'));

grant insert (audience) on public.posts to authenticated;

-- 'removed' is set only by moderators; it hides the post everywhere.
alter table public.posts drop constraint posts_status_check;
alter table public.posts
  add constraint posts_status_check check (status in ('active', 'in_progress', 'resolved', 'removed'));

create function private.guard_removed_posts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.status = 'removed' or new.status = 'removed') and new.status is distinct from old.status
     and not public.is_moderator() then
    raise exception 'only moderators remove or restore posts' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger posts_guard_removed
  before update of status on public.posts
  for each row execute function private.guard_removed_posts();

-- Reports on posts, one per neighbour and post.
create table public.post_flags (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_flags enable row level security;

create policy post_flags_select_moderators on public.post_flags
  for select to authenticated
  using ((select public.is_moderator()));

grant select on public.post_flags to authenticated;
grant all on public.post_flags to service_role;

create function public.flag_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or not exists (select 1 from public.user_codes where user_id = v_user) then
    return 'no_code';
  end if;
  if not exists (select 1 from public.posts where id = p_post_id and status <> 'removed') then
    return 'not_found';
  end if;
  if exists (select 1 from public.posts where id = p_post_id and author_id = v_user) then
    return 'own';
  end if;
  insert into public.post_flags (post_id, user_id) values (p_post_id, v_user) on conflict do nothing;
  return 'ok';
end;
$$;

revoke all on function public.flag_post(uuid) from public, anon;
grant execute on function public.flag_post(uuid) to authenticated;

create function public.moderate_post(p_post_id uuid, p_action text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  if p_action not in ('remove', 'restore') then
    return 'invalid';
  end if;
  update public.posts
    set status = case when p_action = 'remove' then 'removed' else 'active' end
    where id = p_post_id and (p_action = 'remove' or status = 'removed');
  if not found then
    return 'not_found';
  end if;
  if p_action = 'restore' then
    delete from public.post_flags where post_id = p_post_id;
  end if;
  perform public.log_moderation(case when p_action = 'remove' then 'post_removed' else 'post_restored' end, p_post_id::text, p_note);
  return 'ok';
end;
$$;

revoke all on function public.moderate_post(uuid, text, text) from public, anon;
grant execute on function public.moderate_post(uuid, text, text) to authenticated;

create function public.moderate_comment(p_comment_id uuid, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  delete from public.report_comments where id = p_comment_id;
  if not found then
    return 'not_found';
  end if;
  perform public.log_moderation('comment_removed', p_comment_id::text, p_note);
  return 'ok';
end;
$$;

revoke all on function public.moderate_comment(uuid, text) from public, anon;
grant execute on function public.moderate_comment(uuid, text) to authenticated;

-- What the moderators' panel lists: the newest services and donations with how many reports each has,
-- and the removed ones, so a mistake can be undone.
create function public.moderation_posts(p_limit integer default 100)
returns table (
  id uuid,
  type text,
  category text,
  title text,
  description text,
  author_name text,
  author_phone text,
  neighborhood text,
  photos text[],
  status text,
  created_at timestamptz,
  flags integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  return query
    select p.id, p.type, p.category, p.title, p.description, p.author_name, p.author_phone, p.neighborhood,
           p.photos, p.status, p.created_at,
           (select count(*)::integer from public.post_flags f where f.post_id = p.id)
    from public.posts p
    where p.type in ('service', 'favor_offer', 'favor_request')
    order by (select count(*) from public.post_flags f where f.post_id = p.id) desc, p.created_at desc
    limit least(p_limit, 300);
end;
$$;

revoke all on function public.moderation_posts(integer) from public, anon;
grant execute on function public.moderation_posts(integer) to authenticated;

-- The feed: who receives a donation, and nothing that a moderator removed.
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
  audience text
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
    p.audience
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
