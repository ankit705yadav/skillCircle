-- Access-control tests for the SkillCircle schema. Run with `supabase test db`.
begin;
select plan(26);

-- Users: A authors a post, B requests it, C is an outsider.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@example.com'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@example.com');

select is(
  (select count(*)::int from public.profiles),
  3,
  'a profile is created for every auth user'
);

insert into public.skill_posts (id, author_id, type, title, description)
  overriding system value
  values (100, 'aaaaaaaa-0000-0000-0000-000000000000', 'OFFER', 'Guitar lessons', 'Beginner chords');
insert into public.user_locations (user_id, location) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'SRID=4326;POINT(77.59 12.97)'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'SRID=4326;POINT(77.60 12.98)');

-- ---------------------------------------------------------------- as B
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000000","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.skill_posts (author_id, type, title, description)
     values ('bbbbbbbb-0000-0000-0000-000000000000', 'ASK', 'x', 'y') $$,
  '42501', null,
  'clients cannot insert posts directly (moderation bypass)'
);

select is(
  (select count(*)::int from public.user_locations where user_id = 'aaaaaaaa-0000-0000-0000-000000000000'),
  0,
  'other users'' locations are hidden'
);

select is(
  (select array_agg(id) from public.nearby_posts(12.97, 77.59, 10000)),
  array[100::bigint],
  'nearby_posts finds posts within the radius'
);

select is(
  (select count(*)::int from public.nearby_posts(28.61, 77.20, 10000)),
  0,
  'nearby_posts excludes posts outside the radius'
);

select throws_ok(
  $$ insert into public.connections (skill_post_id, approver_id)
     values (100, 'cccccccc-0000-0000-0000-000000000000') $$,
  '42501', null,
  'clients cannot choose the approver'
);

with c as (insert into public.connections (skill_post_id) values (100) returning id)
select set_config('test.conn', id::text, true) from c;

select results_eq(
  $$ select approver_id::text, status::text from public.connections where id = current_setting('test.conn')::bigint $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000000', 'PENDING') $$,
  'the approver is the post author and status starts PENDING'
);

select throws_ok(
  $$ insert into public.connections (skill_post_id) values (100) $$,
  '23505', null,
  'duplicate open requests are rejected'
);

select throws_ok(
  $$ insert into public.messages (connection_id, content) values (current_setting('test.conn')::bigint, 'hi') $$,
  '42501', null,
  'messages cannot be sent on a pending connection'
);

update public.connections set status = 'ACCEPTED' where id = current_setting('test.conn')::bigint;
select is(
  (select status::text from public.connections where id = current_setting('test.conn')::bigint),
  'PENDING',
  'the requester cannot accept their own request'
);

update public.skill_posts set archived = true where id = 100;
select is(
  (select archived from public.skill_posts where id = 100),
  false,
  'non-authors cannot archive a post'
);

-- ---------------------------------------------------------------- as A
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.connections (skill_post_id) values (100) $$,
  'P0001', 'You cannot connect with yourself',
  'authors cannot request their own post'
);

update public.connections set status = 'ACCEPTED' where id = current_setting('test.conn')::bigint;
select ok(
  (select status = 'ACCEPTED' and accepted_at is not null from public.connections where id = current_setting('test.conn')::bigint),
  'the approver can accept, which sets accepted_at'
);

select throws_ok(
  $$ update public.connections set status = 'REJECTED' where id = current_setting('test.conn')::bigint $$,
  'P0001', null,
  'an accepted connection cannot be rejected afterwards'
);

insert into public.messages (connection_id, content) values (current_setting('test.conn')::bigint, 'Welcome!');
select is(
  (select sender_id::text from public.messages where connection_id = current_setting('test.conn')::bigint),
  'aaaaaaaa-0000-0000-0000-000000000000',
  'participants can message on an accepted connection, as themselves'
);

select throws_ok(
  $$ insert into public.messages (connection_id, sender_id, content)
     values (current_setting('test.conn')::bigint, 'bbbbbbbb-0000-0000-0000-000000000000', 'spoof') $$,
  '42501', null,
  'senders cannot impersonate the other participant'
);

update public.skill_posts set archived = true where id = 100;

-- ---------------------------------------------------------------- as B again
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000000","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.skill_posts where id = 100),
  1,
  'archived posts stay visible to connected users'
);

-- ---------------------------------------------------------------- as C
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.connections) + (select count(*)::int from public.messages),
  0,
  'outsiders see no connections or messages'
);

select is(
  (select count(*)::int from public.skill_posts where id = 100),
  0,
  'archived posts are hidden from unconnected users'
);

select throws_ok(
  $$ insert into public.messages (connection_id, content) values (current_setting('test.conn')::bigint, 'intrude') $$,
  '42501', null,
  'outsiders cannot post into a connection'
);

select is(
  array_length(public.generate_usernames(), 1),
  5,
  'generate_usernames returns five names'
);

select throws_ok(
  $$ select public.claim_username('not valid') $$,
  '22023', null,
  'claim_username validates the format'
);

select lives_ok(
  $$ select public.claim_username('HappyPanda42') $$,
  'claim_username claims a valid name'
);

select throws_ok(
  $$ select public.claim_username('LuckyFox11') $$,
  'P0001', 'You have already claimed a username',
  'a username can only be claimed once'
);

-- ---------------------------------------------------------------- as anon
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (public.app_stats() ->> 'totalPosts')::int,
  1,
  'anonymous visitors can read community stats'
);

select throws_ok(
  $$ select * from public.skill_posts $$,
  '42501', null,
  'anonymous visitors cannot read posts'
);

select * from finish();
rollback;
