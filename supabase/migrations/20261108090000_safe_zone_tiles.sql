-- Open places to gather after an earthquake (assembly points, parks, sports pitches, squares), from
-- OpenStreetMap, asked by the safe-zones function. The public Overpass servers now refuse requests
-- from browsers, so the server asks for the app and keeps each neighbourhood (a 0.01 degree tile, about
-- 1 km) for a month: the next neighbour there gets it at once, and Overpass is asked less.
create table public.safe_zone_tiles (
  tile text primary key check (char_length(tile) <= 40),
  zones jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.safe_zone_tiles enable row level security;
-- No policies: only the function (service_role) reads and writes it.
grant select, insert, update, delete on public.safe_zone_tiles to service_role;
