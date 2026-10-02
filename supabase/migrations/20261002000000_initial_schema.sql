-- SkillCircle schema: profiles, private locations, skill posts, connections, messages.
-- Access control lives here (RLS + triggers + column grants); there is no app server.

create extension if not exists postgis with schema extensions;

create type public.post_type as enum ('OFFER', 'ASK');
create type public.connection_status as enum ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Public identity. Users are only ever shown by their generated username.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[A-Z][a-zA-Z]+[0-9]{2}$'),
  created_at timestamptz not null default now()
);

-- Kept out of `profiles` so coordinates are never readable by other users.
create table public.user_locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  location extensions.geography (Point, 4326) not null,
  updated_at timestamptz not null default now()
);
create index user_locations_location_idx on public.user_locations using gist (location);

create table public.skill_posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.post_type not null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 5000),
  poster_image_url text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index skill_posts_author_id_idx on public.skill_posts (author_id);

create table public.connections (
  id bigint generated always as identity primary key,
  skill_post_id bigint not null references public.skill_posts (id) on delete cascade,
  requester_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  approver_id uuid not null references public.profiles (id) on delete cascade,
  status public.connection_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint connections_not_self check (requester_id <> approver_id)
);
create index connections_requester_id_idx on public.connections (requester_id);
create index connections_approver_id_idx on public.connections (approver_id);
-- One open request per (post, requester).
create unique index connections_one_open_request_idx
  on public.connections (skill_post_id, requester_id)
  where status in ('PENDING', 'ACCEPTED');

create table public.messages (
  id bigint generated always as identity primary key,
  connection_id bigint not null references public.connections (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_connection_id_created_at_idx on public.messages (connection_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.is_connection_participant (p_connection_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.connections c
    where c.id = p_connection_id
      and (select auth.uid()) in (c.requester_id, c.approver_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Every auth user gets a profile; the username stays null until claimed.
create function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- The approver is always the post author, never client-supplied.
create function public.connections_before_insert ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
  v_archived boolean;
begin
  select author_id, archived into v_author, v_archived
  from public.skill_posts where id = new.skill_post_id;

  if v_author is null then
    raise exception 'Skill post not found' using errcode = 'P0002';
  end if;
  if v_archived then
    raise exception 'This post has been archived' using errcode = 'P0001';
  end if;
  if v_author = new.requester_id then
    raise exception 'You cannot connect with yourself' using errcode = 'P0001';
  end if;

  new.approver_id := v_author;
  new.status := 'PENDING';
  new.created_at := now();
  new.accepted_at := null;
  return new;
end;
$$;

create trigger connections_before_insert
  before insert on public.connections
  for each row execute function public.connections_before_insert ();

-- Only PENDING -> ACCEPTED/REJECTED is a valid client transition.
create function public.connections_before_update ()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if old.status <> 'PENDING' or new.status not in ('ACCEPTED', 'REJECTED') then
      raise exception 'Invalid status change from % to %', old.status, new.status
        using errcode = 'P0001';
    end if;
    if new.status = 'ACCEPTED' then
      new.accepted_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger connections_before_update
  before update on public.connections
  for each row execute function public.connections_before_update ();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_locations enable row level security;
alter table public.skill_posts enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;

-- profiles: readable by signed-in users; written only via triggers/functions.
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated
  using (true);

-- user_locations: owner only.
create policy "users read their own location"
  on public.user_locations for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users insert their own location"
  on public.user_locations for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users update their own location"
  on public.user_locations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- skill_posts: inserts happen only in the create-post edge function (service
-- role) so moderation cannot be skipped. Authors may only toggle `archived`.
-- Archived posts stay visible to the author and to anyone connected through
-- them, so existing chats keep their context.
create policy "active, own and connected posts are readable"
  on public.skill_posts for select to authenticated
  using (
    not archived
    or author_id = (select auth.uid())
    or exists (
      select 1 from public.connections c
      where c.skill_post_id = skill_posts.id
        and (select auth.uid()) in (c.requester_id, c.approver_id)
    )
  );
create policy "authors update their own posts"
  on public.skill_posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

-- connections: visible to both parties; requester creates, approver decides.
create policy "participants read their connections"
  on public.connections for select to authenticated
  using ((select auth.uid()) in (requester_id, approver_id));
create policy "users request connections as themselves"
  on public.connections for insert to authenticated
  with check (requester_id = (select auth.uid()));
create policy "approvers respond to requests"
  on public.connections for update to authenticated
  using (approver_id = (select auth.uid()))
  with check (approver_id = (select auth.uid()));

-- messages: participants read; send only as yourself on an accepted connection.
create policy "participants read messages"
  on public.messages for select to authenticated
  using (public.is_connection_participant (connection_id));
create policy "participants send messages on accepted connections"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'ACCEPTED'
        and (select auth.uid()) in (c.requester_id, c.approver_id)
    )
  );

-- Column-level grants narrow what policies allow.
revoke all on public.profiles, public.user_locations, public.skill_posts,
  public.connections, public.messages from anon;
revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.skill_posts from authenticated;
grant update (archived) on public.skill_posts to authenticated;
revoke insert, update, delete on public.connections from authenticated;
grant insert (skill_post_id) on public.connections to authenticated;
grant update (status) on public.connections to authenticated;
revoke insert, update, delete on public.messages from authenticated;
grant insert (connection_id, content) on public.messages to authenticated;
revoke delete on public.user_locations from authenticated;

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

create function public.set_my_location (lat double precision, lon double precision)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.user_locations (user_id, location, updated_at)
  values (
    (select auth.uid()),
    extensions.st_setsrid (extensions.st_makepoint (lon, lat), 4326)::extensions.geography,
    now()
  )
  on conflict (user_id) do update
    set location = excluded.location, updated_at = excluded.updated_at;
$$;

-- Security definer because it must read other users' locations, which RLS hides.
-- Only post rows leave the function, never coordinates.
create function public.nearby_posts (lat double precision, lon double precision, radius_m integer default 1000000)
returns setof public.skill_posts
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.skill_posts p
  join public.user_locations l on l.user_id = p.author_id
  where not p.archived
    and p.author_id <> (select auth.uid())
    and extensions.st_dwithin (
      l.location,
      extensions.st_setsrid (extensions.st_makepoint (lon, lat), 4326)::extensions.geography,
      radius_m
    )
  order by p.created_at desc;
$$;

-- Five unclaimed names in the AdjectiveNoun## format.
create function public.generate_usernames ()
returns text[]
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  adjectives text[] := array['Agile', 'Bright', 'Clever', 'Daring', 'Eager', 'Fearless',
                             'Gentle', 'Happy', 'Jolly', 'Keen', 'Lucky', 'Mighty'];
  nouns text[] := array['Panda', 'Fox', 'Lion', 'Tiger', 'Eagle', 'Shark',
                        'Wolf', 'Bear', 'Hawk', 'Koala', 'Jaguar', 'Leopard'];
  result text[] := '{}';
  candidate text;
  attempts int := 0;
begin
  while coalesce(array_length(result, 1), 0) < 5 and attempts < 200 loop
    attempts := attempts + 1;
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
              || nouns[1 + floor(random() * array_length(nouns, 1))::int]
              || (10 + floor(random() * 90))::int;
    if not candidate = any (result)
       and not exists (select 1 from public.profiles where username = candidate) then
      result := result || candidate;
    end if;
  end loop;
  return result;
end;
$$;

create function public.claim_username (p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  select username into v_current from public.profiles where id = (select auth.uid());
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if v_current is not null then
    raise exception 'You have already claimed a username' using errcode = 'P0001';
  end if;
  if p_username is null or p_username !~ '^[A-Z][a-zA-Z]+[0-9]{2}$' then
    raise exception 'Username format is invalid' using errcode = '22023';
  end if;

  update public.profiles set username = p_username where id = (select auth.uid());
exception
  when unique_violation then
    raise exception 'Username "%" has just been taken', p_username using errcode = '23505';
end;
$$;

-- Public community counters for the home page.
create function public.app_stats ()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'totalUsers', (select count(*) from public.profiles),
    'totalConnections', (select count(*) from public.connections),
    'activeConnections', (select count(*) from public.connections where status = 'ACCEPTED'),
    'totalPosts', (select count(*) from public.skill_posts),
    'activePosts', (select count(*) from public.skill_posts where not archived)
  );
$$;

revoke execute on function public.set_my_location (double precision, double precision) from public, anon;
revoke execute on function public.nearby_posts (double precision, double precision, integer) from public, anon;
revoke execute on function public.generate_usernames () from public, anon;
revoke execute on function public.claim_username (text) from public, anon;
revoke execute on function public.is_connection_participant (bigint) from public, anon;
revoke execute on function public.handle_new_user () from public, anon, authenticated;
revoke execute on function public.connections_before_insert () from public, anon, authenticated;
grant execute on function public.set_my_location (double precision, double precision) to authenticated;
grant execute on function public.nearby_posts (double precision, double precision, integer) to authenticated;
grant execute on function public.generate_usernames () to authenticated;
grant execute on function public.claim_username (text) to authenticated;
grant execute on function public.is_connection_participant (bigint) to authenticated;
grant execute on function public.app_stats () to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: RLS-filtered change feeds replace the old STOMP notifications.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.connections, public.messages;
