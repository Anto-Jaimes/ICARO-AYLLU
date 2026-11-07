-- Official hazard data for Peru: IGP earthquakes and SENAMHI warnings.
--
-- The ingest-hazards Edge Function fills these tables on a schedule, so the app never
-- talks to IGP or SENAMHI directly: IGP blocks browsers, and a single cached copy keeps
-- working when those sites are slow. Clients only read; there are no write grants.

-- ---------------------------------------------------------------------------
-- Geography
-- ---------------------------------------------------------------------------

create table public.departments (
  id text primary key, -- INEI code
  name text not null unique,
  -- How the official feeds spell it: uppercase, no accents.
  source_key text not null unique,
  -- SENAMHI macro-regions that overlap the department ("Selva Centro"...).
  macro_regions text[] not null default '{}',
  geom extensions.geometry(multipolygon, 4326)
);

insert into public.departments (id, name, source_key) values
  ('01', 'Amazonas', 'AMAZONAS'), ('02', 'Áncash', 'ANCASH'), ('03', 'Apurímac', 'APURIMAC'),
  ('04', 'Arequipa', 'AREQUIPA'), ('05', 'Ayacucho', 'AYACUCHO'), ('06', 'Cajamarca', 'CAJAMARCA'),
  ('07', 'Callao', 'CALLAO'), ('08', 'Cusco', 'CUSCO'), ('09', 'Huancavelica', 'HUANCAVELICA'),
  ('10', 'Huánuco', 'HUANUCO'), ('11', 'Ica', 'ICA'), ('12', 'Junín', 'JUNIN'),
  ('13', 'La Libertad', 'LA LIBERTAD'), ('14', 'Lambayeque', 'LAMBAYEQUE'), ('15', 'Lima', 'LIMA'),
  ('16', 'Loreto', 'LORETO'), ('17', 'Madre de Dios', 'MADRE DE DIOS'), ('18', 'Moquegua', 'MOQUEGUA'),
  ('19', 'Pasco', 'PASCO'), ('20', 'Piura', 'PIURA'), ('21', 'Puno', 'PUNO'),
  ('22', 'San Martín', 'SAN MARTIN'), ('23', 'Tacna', 'TACNA'), ('24', 'Tumbes', 'TUMBES'),
  ('25', 'Ucayali', 'UCAYALI');

create index departments_geom_idx on public.departments using gist (geom);

create table public.macro_regions (
  name text primary key,
  geom extensions.geometry(multipolygon, 4326) not null
);

-- ---------------------------------------------------------------------------
-- Hazard data
-- ---------------------------------------------------------------------------

create table public.hazard_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('IGP', 'SENAMHI')),
  external_id text not null,
  kind text not null check (kind in ('sismo', 'aviso_meteorologico')),
  title text not null,
  detail text,
  level text check (level in ('amarillo', 'naranja', 'rojo')),
  magnitude numeric(3, 1),
  depth_km integer,
  lat double precision,
  lng double precision,
  -- Empty means the whole country.
  departments text[] not null default '{}',
  occurred_at timestamptz not null,
  starts_at timestamptz,
  ends_at timestamptz,
  url text,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create index hazard_events_kind_time_idx on public.hazard_events (kind, occurred_at desc);
create index hazard_events_departments_idx on public.hazard_events using gin (departments);

-- Polygons at risk today. Replaced as a whole each time SENAMHI issues a new bulletin.
create table public.hazard_zones (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('huaico', 'lluvia_intensa')),
  level smallint not null check (level between 2 and 4), -- 2 amarillo, 3 naranja, 4 rojo
  description text,
  recommendation text,
  department_id text references public.departments (id),
  province text,
  district text,
  issued_on date not null,
  batch_id uuid not null,
  geom extensions.geometry(multipolygon, 4326) not null
);

create index hazard_zones_geom_idx on public.hazard_zones using gist (geom);
create index hazard_zones_department_idx on public.hazard_zones (department_id, kind);
create index hazard_zones_kind_batch_idx on public.hazard_zones (kind, batch_id);

create table public.ingest_status (
  source text primary key,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  records integer
);

-- ---------------------------------------------------------------------------
-- Access: anyone can read, only the ingest function (service_role) can write.
-- ---------------------------------------------------------------------------

alter table public.departments enable row level security;
alter table public.macro_regions enable row level security;
alter table public.hazard_events enable row level security;
alter table public.hazard_zones enable row level security;
alter table public.ingest_status enable row level security;

create policy departments_select_all on public.departments
  for select to anon, authenticated using (true);
create policy hazard_events_select_all on public.hazard_events
  for select to anon, authenticated using (true);
create policy hazard_zones_select_all on public.hazard_zones
  for select to anon, authenticated using (true);
create policy ingest_status_select_all on public.ingest_status
  for select to anon, authenticated using (true);

grant select on public.departments, public.hazard_events, public.hazard_zones to anon, authenticated;
-- last_error stays private: it can reveal internals of the ingest.
grant select (source, last_success_at) on public.ingest_status to anon, authenticated;

grant select, insert, update, delete on
  public.departments, public.macro_regions, public.hazard_events, public.hazard_zones, public.ingest_status
  to service_role;

-- ---------------------------------------------------------------------------
-- Ingest helpers (service_role only)
-- ---------------------------------------------------------------------------

create function public.load_department_boundary(p_source_key text, p_geojson text)
returns void
language sql
set search_path = ''
as $$
  -- Simplified to about 100 m: enough to place a neighbour, far lighter to query.
  update public.departments
  set geom = extensions.st_multi(extensions.st_collectionextract(extensions.st_makevalid(
    extensions.st_simplifypreservetopology(
      extensions.st_setsrid(extensions.st_geomfromgeojson(p_geojson), 4326), 0.001
    )
  ), 3))
  where source_key = p_source_key;
$$;

create function public.load_macro_region(p_name text, p_geojson text)
returns void
language sql
set search_path = ''
as $$
  insert into public.macro_regions (name, geom)
  values (
    p_name,
    extensions.st_multi(extensions.st_collectionextract(extensions.st_makevalid(
      extensions.st_simplifypreservetopology(
        extensions.st_setsrid(extensions.st_geomfromgeojson(p_geojson), 4326), 0.001
      )
    ), 3))
  )
  on conflict (name) do update set geom = excluded.geom;
$$;

-- Which macro-regions each department really overlaps, using SENAMHI's own polygons.
-- The 2% floor ignores slivers where two borders barely touch.
create function public.refresh_department_macro_regions()
returns void
language sql
set search_path = ''
as $$
  update public.departments d
  set macro_regions = coalesce((
    select array_agg(r.name order by r.name)
    from public.macro_regions r
    where extensions.st_intersects(d.geom, r.geom)
      and extensions.st_area(extensions.st_intersection(d.geom, r.geom)) / extensions.st_area(d.geom) > 0.02
  ), '{}')
  where d.geom is not null;
$$;

create function public.insert_hazard_zones(p_kind text, p_batch_id uuid, p_features jsonb)
returns integer
language sql
set search_path = ''
as $$
  with parsed as (
    select
      f.feature -> 'properties' as props,
      regexp_replace(f.feature -> 'properties' ->> 'nivel', '\D', '', 'g')::smallint as level,
      f.feature ->> 'geometry' as geojson
    from jsonb_array_elements(p_features) as f(feature)
  ),
  inserted as (
    insert into public.hazard_zones (
      kind, level, description, recommendation, department_id, province, district,
      issued_on, batch_id, geom
    )
    select
      p_kind,
      p.level,
      coalesce(p.props ->> 'descripcion', p.props ->> 'descripcio'),
      coalesce(p.props ->> 'recomendacion', p.props ->> 'recomendac'),
      d.id,
      p.props ->> 'nombprov',
      p.props ->> 'nombdist',
      left(p.props ->> 'fecha', 10)::date,
      p_batch_id,
      extensions.st_multi(extensions.st_collectionextract(extensions.st_makevalid(
        extensions.st_setsrid(extensions.st_geomfromgeojson(p.geojson), 4326)
      ), 3))
    from parsed p
    left join public.departments d on d.source_key = p.props ->> 'nombdep'
    where p.level between 2 and 4 -- level 1 means no hazard
    returning 1
  )
  select count(*)::integer from inserted;
$$;

revoke execute on function public.load_department_boundary(text, text) from public, anon, authenticated;
revoke execute on function public.load_macro_region(text, text) from public, anon, authenticated;
revoke execute on function public.refresh_department_macro_regions() from public, anon, authenticated;
revoke execute on function public.insert_hazard_zones(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.load_department_boundary(text, text) to service_role;
grant execute on function public.load_macro_region(text, text) to service_role;
grant execute on function public.refresh_department_macro_regions() to service_role;
grant execute on function public.insert_hazard_zones(text, uuid, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- What the app asks for
-- ---------------------------------------------------------------------------

-- Everything the home screen shows in one round trip. With coordinates it resolves
-- the department from the official boundaries and checks whether that exact point is
-- inside a risk zone. With p_department_id it shows that department instead.
create function public.hazard_feed(
  p_lat double precision default null,
  p_lng double precision default null,
  p_department_id text default null
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_point extensions.geometry;
  v_department public.departments;
  v_is_here boolean := false;
  -- SENAMHI bulletins last 24 h from 13:00 Lima (18:00 UTC) of their issue date.
  v_oldest_valid timestamp := (now() at time zone 'utc') - interval '42 hours';
begin
  if p_lat is not null and p_lng is not null then
    v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326);
  end if;

  if p_department_id is not null then
    select * into v_department from public.departments where id = p_department_id;
  elsif v_point is not null then
    -- Nearest within about 50 km, so a coastal GPS reading still lands on land.
    select * into v_department
    from public.departments
    where extensions.st_dwithin(geom, v_point, 0.5)
    order by extensions.st_distance(geom, v_point)
    limit 1;
  end if;

  if v_department.id is not null and v_point is not null then
    v_is_here := extensions.st_dwithin(v_department.geom, v_point, 0.5);
  end if;

  return jsonb_build_object(
    'department', case when v_department.id is null then null else jsonb_build_object(
      'id', v_department.id,
      'name', v_department.name,
      'lat', extensions.st_y(extensions.st_pointonsurface(v_department.geom)),
      'lng', extensions.st_x(extensions.st_pointonsurface(v_department.geom))
    ) end,

    'is_here', v_is_here,

    'zones_here', coalesce((
      select jsonb_agg(to_jsonb(z) order by z.level desc)
      from (
        select distinct on (hz.kind)
          hz.kind, hz.level, hz.description, hz.recommendation, hz.province, hz.district
        from public.hazard_zones hz
        where v_is_here
          and hz.issued_on::timestamp > v_oldest_valid
          and extensions.st_intersects(hz.geom, v_point)
        order by hz.kind, hz.level desc
      ) z
    ), '[]'::jsonb),

    'huaico_summary', (
      with at_risk as (
        select hz.level, hz.district, max(hz.level) over () as max_level
        from public.hazard_zones hz
        where hz.kind = 'huaico'
          and hz.department_id = v_department.id
          and hz.issued_on::timestamp > v_oldest_valid
      )
      select jsonb_build_object(
        'max_level', max(a.max_level),
        'districts', count(distinct a.district),
        'top_districts', (array_agg(distinct a.district) filter (where a.level = a.max_level))[1:5]
      )
      from at_risk a
      having count(*) > 0
    ),

    'rain_level', (
      select max(hz.level)
      from public.hazard_zones hz
      where hz.kind = 'lluvia_intensa'
        and hz.issued_on::timestamp > v_oldest_valid
        and extensions.st_intersects(hz.geom, v_department.geom)
    ),

    'notices', coalesce((
      select jsonb_agg(to_jsonb(n))
      from (
        select e.id, e.title, e.detail, e.level, e.starts_at, e.ends_at, e.url
        from public.hazard_events e
        where e.kind = 'aviso_meteorologico'
          and e.ends_at > now()
          and (e.departments = '{}' or e.departments @> array[v_department.name])
        order by array_position(array['rojo', 'naranja', 'amarillo'], e.level), e.starts_at
        limit 10
      ) n
    ), '[]'::jsonb),

    'quakes', coalesce((
      select jsonb_agg(to_jsonb(q))
      from (
        select e.id, e.detail, e.magnitude, e.depth_km, e.occurred_at, e.url
        from public.hazard_events e
        where e.kind = 'sismo' and e.departments @> array[v_department.name]
        order by e.occurred_at desc
        limit 5
      ) q
    ), '[]'::jsonb),

    'latest_quake_peru', (
      select to_jsonb(q)
      from (
        select e.id, e.detail, e.magnitude, e.depth_km, e.occurred_at, e.url
        from public.hazard_events e
        where e.kind = 'sismo'
        order by e.occurred_at desc
        limit 1
      ) q
    ),

    'updated_at', (select jsonb_object_agg(s.source, s.last_success_at) from public.ingest_status s)
  );
end;
$$;

revoke execute on function public.hazard_feed(double precision, double precision, text)
  from public, anon, authenticated;
grant execute on function public.hazard_feed(double precision, double precision, text)
  to anon, authenticated;

alter publication supabase_realtime add table public.hazard_events;
