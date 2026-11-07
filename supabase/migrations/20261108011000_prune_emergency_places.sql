-- The import reads OpenStreetMap in squares, and border squares bring places from Ecuador,
-- Colombia, Brazil, Bolivia and Chile. Keep only what falls inside Peru's official boundaries,
-- so nobody near a border is sent to another country's police with a foreign phone.
create function public.prune_emergency_places()
returns integer
language sql
security definer
set search_path = ''
as $$
  with removed as (
    delete from public.emergency_places e
    where not exists (
      select 1 from public.departments d
      where d.geom is not null
        and extensions.st_covers(d.geom, extensions.st_setsrid(extensions.st_makepoint(e.lng, e.lat), 4326))
    )
    returning 1
  )
  select count(*)::integer from removed;
$$;

revoke execute on function public.prune_emergency_places() from public, anon, authenticated;
grant execute on function public.prune_emergency_places() to service_role;
