-- Strong news waits for a moderator before it reaches the home screen: a text about violence,
-- death, injured people, weapons or crime, and any accident that brings a photo or video.
-- Everything else is published at once, as before. The check runs here, in the database, so a
-- modified app cannot skip it. A false alarm only means that a moderator looks at it first.

create function public.is_strong_report(p_kind text, p_description text, p_has_media boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_kind = 'accidente' and coalesce(p_has_media, false))
    or translate(lower(coalesce(p_description, '')), 'áéíóúüàèìòù', 'aeiouuaeiou') ~ (
      '\m('
      -- weapons and shots
      || 'bala|balas|balazos?|balacera|bale(a|o|ad|ar|aron)\w*|tiroteos?|tiros|'
      || 'dispar(o|os|aron|an|aba|aban|ando|ado|ados|ar)|armas? de fuego|pistolas?|revolver|escopetas?|'
      || 'cuchillo\w*|cuchillada\w*|navaja\w*|apunal\w*|acuchill\w*|machetazo\w*|'
      -- death
      || 'muert\w*|murio|murieron|fallec\w*|cadaver\w*|occis\w*|sin vida|victimas?|'
      || 'asesin\w*|mataron|matan|mato|matar\w*|homicidio\w*|feminicidio\w*|sicari\w*|'
      || 'decapit\w*|degoll\w*|descuartiz\w*|ahorcad\w*|suicid\w*|linch\w*|tortur\w*|'
      -- injured people and blood
      || 'herid[oa]s?|lesionad\w*|sangr\w*|ensangrentad\w*|golpiza\w*|agredid\w*|agresion\w*|atropell\w*|'
      -- crime
      || 'atentado\w*|explosivo\w*|dinamita|asalt\w*|secuestr\w*|violacion\w*|violad\w*|'
      || 'abuso sexual|abusaron|tocamientos|extorsi\w*'
      || ')\M'
    );
$$;

revoke execute on function public.is_strong_report(text, text, boolean) from public, anon, authenticated;

-- Same as before, plus the strong-news check.
create or replace function public.create_report(
  p_kind text,
  p_description text,
  p_author_name text,
  p_department text,
  p_province text,
  p_district text,
  p_lat double precision,
  p_lng double precision,
  p_media_path text default null,
  p_media_type text default null,
  p_media_check text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_status text := 'published';
  v_reason text := null;
  v_recent integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select count(*) into v_recent
  from public.reports
  where author_id = v_user_id and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    return jsonb_build_object('status', 'rejected', 'reason', 'too_many');
  end if;

  -- News is for what is happening, not for selling: that belongs in Servicios.
  if p_description ~* '(s/\.?\s*\d|\m(ofertas?|promoci[oó]n|promos?|descuentos?|vendo|ventas?|precios?|delivery|cont[aá]ctame|cont[aá]ctanos|whatsapp|wsp|escr[ií]beme|s[ií]guenos|mi negocio|mi tienda|cotiza|remate|liquidaci[oó]n)\M|https?://|www\.|\m9\d{2}[ -]?\d{3}[ -]?\d{3}\M)' then
    return jsonb_build_object('status', 'rejected', 'reason', 'advertising');
  end if;

  if p_media_path is not null then
    if split_part(p_media_path, '/', 1) <> v_user_id::text then
      raise exception 'invalid media path' using errcode = '42501';
    end if;
    -- Anything but an explicit clean result waits for a person.
    if p_media_check is distinct from 'clean' then
      v_status := 'review';
      v_reason := 'media';
    end if;
  end if;

  -- Strong news waits for a moderator.
  if public.is_strong_report(p_kind, p_description, p_media_path is not null) then
    v_status := 'review';
    v_reason := coalesce(v_reason, 'strong');
  end if;

  insert into public.reports (
    author_id, kind, description, author_name, media_path, media_type,
    department, province, district, lat, lng, status
  )
  values (
    v_user_id, p_kind, p_description, p_author_name, p_media_path, p_media_type,
    p_department, p_province, p_district, p_lat, p_lng, v_status
  );

  return jsonb_build_object('status', v_status, 'reason', v_reason);
end;
$$;
