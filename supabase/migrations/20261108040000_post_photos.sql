-- Photos for services and favours: a neighbour shows the cake, the dish, the finished job.
-- Up to 4 per post, images only, 5 MB each. Paths start with the author's id, so nobody can upload
-- into or delete from another neighbour's folder.

alter table public.posts
  add column photos text[] not null default '{}'
  check (cardinality(photos) <= 4);

grant insert (photos) on public.posts to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy post_photos_upload_own_folder on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Storage only deletes what the caller can select: without this, removing a photo did nothing.
create policy post_photos_select_own_files on storage.objects
  for select to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy post_photos_delete_own_files on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- The same feed, plus the photos.
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
  photos text[]
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
    p.photos
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
