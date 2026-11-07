-- Police stations, fire stations and hospitals of Peru from OpenStreetMap (© OpenStreetMap
-- contributors, ODbL), so the app can show the nearest ones, with their phone when it is known.
-- Loaded and refreshed by scripts/import-emergency-places.ts with the secret key.

create table public.emergency_places (
  osm_id text primary key check (char_length(osm_id) <= 30),
  kind text not null check (kind in ('police', 'fire_station', 'hospital')),
  name text check (char_length(name) <= 160),
  phone text check (char_length(phone) <= 80),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
  ) stored,
  updated_at timestamptz not null default now()
);

create index emergency_places_location_idx on public.emergency_places using gist (location);
create index emergency_places_kind_idx on public.emergency_places (kind);

alter table public.emergency_places enable row level security;

create policy emergency_places_read on public.emergency_places
  for select to anon, authenticated
  using (true);

grant select on public.emergency_places to anon, authenticated;
grant select, insert, update, delete on public.emergency_places to service_role;

-- The nearest of each kind, closest first. Public data: anyone may ask.
create function public.nearby_emergency_places(p_lat double precision, p_lng double precision, p_per_kind integer default 2)
returns table (kind text, name text, phone text, lat double precision, lng double precision, distance_m integer)
language sql
stable
set search_path = ''
as $$
  with here as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as point
  )
  select nearest.kind, nearest.name, nearest.phone, nearest.lat, nearest.lng, nearest.distance_m
  from unnest(array['police', 'fire_station', 'hospital']) with ordinality as wanted(kind, position)
  cross join here
  cross join lateral (
    select e.kind, e.name, e.phone, e.lat, e.lng,
           round(extensions.st_distance(e.location, here.point))::integer as distance_m
    from public.emergency_places e
    where e.kind = wanted.kind
    order by e.location operator(extensions.<->) here.point
    limit least(greatest(coalesce(p_per_kind, 2), 1), 5)
  ) nearest
  order by wanted.position, nearest.distance_m;
$$;

revoke execute on function public.nearby_emergency_places(double precision, double precision, integer) from public;
grant execute on function public.nearby_emergency_places(double precision, double precision, integer) to anon, authenticated;
