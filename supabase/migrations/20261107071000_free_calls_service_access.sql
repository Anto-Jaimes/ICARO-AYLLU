-- The calling program uses the secret key (service_role). In this project new tables do not
-- grant it anything by default, so it needs explicit access to the call tables, like the
-- SENAMHI relay has for the hazard tables.
grant select, insert, update, delete on
  public.phone_verifications,
  public.verified_phones,
  public.call_requests,
  public.call_center_status
to service_role;
