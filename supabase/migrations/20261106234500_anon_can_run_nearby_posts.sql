-- nearby_posts looks up post_votes for every caller, so visitors without a session
-- need the privilege for the query to run. No policy applies to anon, so they still
-- see zero rows: votes stay private and has_user_voted is simply false for them.
grant select on public.post_votes to anon;
