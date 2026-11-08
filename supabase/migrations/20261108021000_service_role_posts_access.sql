-- The server programs and test helpers use the secret key (service_role). In this project new tables do
-- not give it access on their own, so it could not even read posts: test posts stayed public with no way
-- to remove them except by hand. Same fix as 20261107071000 for the calls tables.
grant select, insert, update, delete on public.posts, public.post_votes, public.reviews to service_role;
