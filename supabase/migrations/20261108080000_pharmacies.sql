-- Pharmacies from OpenStreetMap, next to the police, fire stations and hospitals already there: real
-- places, with the address, hours and phone the map has (© OpenStreetMap contributors, ODbL).
-- Which pharmacy is "de turno" today is not published as open data, so the app never claims it: it
-- says to call first, and sends to DIGEMID's official search for medicines and prices.
-- Loaded by: node scripts/import-emergency-places.ts --farmacias

alter table public.emergency_places drop constraint emergency_places_kind_check;
alter table public.emergency_places
  add constraint emergency_places_kind_check check (kind in ('police', 'fire_station', 'hospital', 'pharmacy'));

alter table public.emergency_places
  add column address text check (char_length(address) <= 200),
  add column opening_hours text check (char_length(opening_hours) <= 200);

-- The nearest pharmacies within 20 km, closest first. Public data: anyone may ask.
create function public.nearby_pharmacies(p_lat double precision, p_lng double precision, p_limit integer default 8)
returns table (name text, phone text, address text, opening_hours text, lat double precision, lng double precision, distance_m integer)
language sql
stable
set search_path = ''
as $$
  with here as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as point
  )
  select e.name, e.phone, e.address, e.opening_hours, e.lat, e.lng,
         round(extensions.st_distance(e.location, here.point))::integer as distance_m
  from public.emergency_places e
  cross join here
  where e.kind = 'pharmacy'
    and extensions.st_dwithin(e.location, here.point, 20000)
  order by e.location operator(extensions.<->) here.point
  limit least(greatest(coalesce(p_limit, 8), 1), 20);
$$;

revoke execute on function public.nearby_pharmacies(double precision, double precision, integer) from public;
grant execute on function public.nearby_pharmacies(double precision, double precision, integer) to anon, authenticated;
