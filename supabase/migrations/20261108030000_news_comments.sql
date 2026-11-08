-- Comments on neighbour news: people nearby ask what happened, where, whether someone needs help.
-- Anyone can read them. Only neighbours with a user code can write (the app, or the web entered with
-- the code and the app's key). The author or a moderator can remove one.
--
-- The feed also returns where the news happened, rounded to about 100 m: enough to find the street,
-- without pointing at the exact door of whoever reported it.

create table public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 60),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index report_comments_report_idx on public.report_comments (report_id, created_at);
create index report_comments_author_idx on public.report_comments (author_id, created_at desc);

alter table public.report_comments enable row level security;

-- A comment is visible when its news is: the reports policies already decide that.
create policy report_comments_select on public.report_comments
  for select to anon, authenticated
  using (exists (select 1 from public.reports r where r.id = report_id));

create policy report_comments_delete_own_or_moderator on public.report_comments
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_moderator()));

grant select on public.report_comments to anon, authenticated;
grant delete on public.report_comments to authenticated;
grant all on public.report_comments to service_role;

create function public.add_report_comment(p_report_id uuid, p_author_name text, p_body text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text := left(btrim(coalesce(p_author_name, '')), 60);
  v_body text := btrim(coalesce(p_body, ''));
begin
  if v_user is null or not exists (select 1 from public.user_codes where user_id = v_user) then
    return 'no_code';
  end if;
  if char_length(v_body) not between 1 and 500 then
    return 'invalid';
  end if;
  if char_length(v_name) = 0 then
    v_name := 'Vecino';
  end if;
  if not exists (select 1 from public.reports r where r.id = p_report_id and r.status = 'published') then
    return 'not_found';
  end if;
  if (select count(*) from public.report_comments where author_id = v_user and created_at > now() - interval '1 hour') >= 20 then
    return 'too_many';
  end if;
  insert into public.report_comments (report_id, author_id, author_name, body)
  values (p_report_id, v_user, v_name, v_body);
  return 'ok';
end;
$$;

revoke all on function public.add_report_comment(uuid, text, text) from public, anon;
grant execute on function public.add_report_comment(uuid, text, text) to authenticated;

-- Same feed, plus the rounded place and how many comments each news has.
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
  comment_count integer
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
    (select count(*)::integer from public.report_comments c where c.report_id = r.id)
  from public.reports r
  where (p_department is null or r.department = p_department)
    and (p_province is null or r.province = p_province)
    and (p_district is null or r.district = p_district)
  order by r.created_at desc
  limit least(p_limit, 100);
$$;

revoke execute on function public.reports_feed(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.reports_feed(text, text, text, integer) to anon, authenticated;
