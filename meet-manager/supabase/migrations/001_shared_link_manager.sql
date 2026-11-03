-- Shared Link Manager: groups, membership requests, email invitations and exclusive link locks.
-- Run this migration in Supabase SQL Editor or with the Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  owner_id uuid not null references auth.users(id) on delete restrict,
  is_discoverable boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  unique (group_id, user_id, requested_at)
);

create unique index if not exists group_join_requests_one_pending
  on public.group_join_requests(group_id, user_id) where status = 'pending';

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists group_invitations_one_pending
  on public.group_invitations(group_id, lower(email)) where status = 'pending';

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  url text not null check (url ~* '^https?://'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.link_locks (
  link_id uuid primary key references public.links(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.link_usage_history (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  released_at timestamptz
);

create index if not exists links_group_id_idx on public.links(group_id);
create index if not exists group_members_user_id_idx on public.group_members(user_id);
create index if not exists link_usage_history_link_id_idx on public.link_usage_history(link_id, claimed_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, display_name)
select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'display_name', '')
from auth.users
on conflict (id) do update set email = excluded.email;

create or replace function public.set_group_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$;

-- SECURITY DEFINER helpers avoid recursive RLS evaluation between membership policies.
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_user_id
  );
$;

create or replace function public.is_group_owner(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.owner_id = p_user_id
  );
$;

create or replace function public.is_group_peer(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = p_profile_id
  );
$;

revoke all on function public.is_group_member(uuid, uuid) from public;
revoke all on function public.is_group_owner(uuid, uuid) from public;
revoke all on function public.is_group_peer(uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_owner(uuid, uuid) to authenticated;
grant execute on function public.is_group_peer(uuid) to authenticated;

drop trigger if exists on_group_created_add_owner on public.groups;
create trigger on_group_created_add_owner
  after insert on public.groups
  for each row execute procedure public.set_group_owner();

create or replace function public.request_to_join_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_request_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.groups where id = p_group_id and is_discoverable) then
    raise exception 'Group is not available for joining';
  end if;
  if exists (select 1 from public.group_members where group_id = p_group_id and user_id = auth.uid()) then
    raise exception 'You are already a member';
  end if;

  insert into public.group_join_requests (group_id, user_id)
  values (p_group_id, auth.uid())
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.review_group_join_request(p_request_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_group_id uuid;
  v_user_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select r.group_id, r.user_id into v_group_id, v_user_id
  from public.group_join_requests r
  join public.groups g on g.id = r.group_id
  where r.id = p_request_id and g.owner_id = auth.uid() and r.status = 'pending'
  for update of r;

  if v_group_id is null then raise exception 'Request not found or permission denied'; end if;

  update public.group_join_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_request_id;

  if p_approve then
    insert into public.group_members (group_id, user_id, role)
    values (v_group_id, v_user_id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;
end;
$$;

create or replace function public.accept_group_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_group_id uuid;
  v_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  update public.group_invitations
  set status = 'accepted', accepted_at = now()
  where id = p_invitation_id
    and lower(email) = v_email
    and status = 'pending'
  returning group_id into v_group_id;

  if v_group_id is null then raise exception 'Invitation not found or email does not match'; end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
end;
$$;

create or replace function public.claim_link(p_link_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_group_id uuid;
  v_expires_at timestamptz := now() + interval '30 minutes';
  v_inserted integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select group_id into v_group_id from public.links where id = p_link_id;
  if v_group_id is null then raise exception 'Link not found'; end if;

  if not exists (
    select 1 from public.group_members
    where group_id = v_group_id and user_id = auth.uid()
  ) then raise exception 'You are not a group member'; end if;

  -- Expired claims are reclaimed atomically before the unique-key insert.
  delete from public.link_locks where link_id = p_link_id and expires_at <= now();

  insert into public.link_locks (link_id, user_id, claimed_at, expires_at)
  values (p_link_id, auth.uid(), now(), v_expires_at)
  on conflict (link_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then raise exception 'This link is already in use'; end if;

  insert into public.link_usage_history (link_id, user_id, claimed_at)
  values (p_link_id, auth.uid(), now());

  return v_expires_at;
end;
$$;

create or replace function public.release_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_lock_user uuid;
  v_group_owner uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select g.owner_id into v_group_owner
  from public.links l join public.groups g on g.id = l.group_id
  where l.id = p_link_id;

  delete from public.link_locks
  where link_id = p_link_id
    and (user_id = auth.uid() or v_group_owner = auth.uid())
  returning user_id into v_lock_user;

  if v_lock_user is null then raise exception 'Lock not found or permission denied'; end if;

  update public.link_usage_history
  set released_at = now()
  where id = (
    select id from public.link_usage_history
    where link_id = p_link_id and user_id = v_lock_user and released_at is null
    order by claimed_at desc limit 1
  );
end;
$$;

-- Restrict direct access to lock writes; claims/releases must go through atomic RPCs.
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_join_requests enable row level security;
alter table public.group_invitations enable row level security;
alter table public.links enable row level security;
alter table public.link_locks enable row level security;
alter table public.link_usage_history enable row level security;

drop policy if exists "Profiles visible to self and group peers" on public.profiles;
create policy "Profiles visible to self and group peers" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_group_peer(id));

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Discoverable groups and member groups visible" on public.groups;
create policy "Discoverable groups and member groups visible" on public.groups
for select to authenticated
using (is_discoverable or public.is_group_member(id));

drop policy if exists "Authenticated users create own groups" on public.groups;
create policy "Authenticated users create own groups" on public.groups
for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Owners update groups" on public.groups;
create policy "Owners update groups" on public.groups
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "Members view group membership" on public.group_members;
create policy "Members view group membership" on public.group_members
for select to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Owners manage group members" on public.group_members;
create policy "Owners manage group members" on public.group_members
for delete to authenticated
using (public.is_group_owner(group_id));

drop policy if exists "Users view own requests and owners view group requests" on public.group_join_requests;
create policy "Users view own requests and owners view group requests" on public.group_join_requests
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_group_owner(group_id)
);

drop policy if exists "Users create own requests for discoverable groups" on public.group_join_requests;
create policy "Users create own requests for discoverable groups" on public.group_join_requests
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and exists (select 1 from public.groups g where g.id = group_join_requests.group_id and g.is_discoverable)
);

drop policy if exists "Owners view and manage invitations" on public.group_invitations;
create policy "Owners view and manage invitations" on public.group_invitations
for all to authenticated
using (public.is_group_owner(group_id))
with check (invited_by = (select auth.uid()) and public.is_group_owner(group_id));

drop policy if exists "Invitees view invitations for their email" on public.group_invitations;
create policy "Invitees view invitations for their email" on public.group_invitations
for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Members view links" on public.links;
create policy "Members view links" on public.links
for select to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Owners manage links" on public.links;
create policy "Owners manage links" on public.links
for all to authenticated
using (public.is_group_owner(group_id))
with check (created_by = (select auth.uid()) and public.is_group_owner(group_id));

drop policy if exists "Members view link locks" on public.link_locks;
create policy "Members view link locks" on public.link_locks
for select to authenticated
using (exists (select 1 from public.links l where l.id = link_locks.link_id and public.is_group_member(l.group_id)));

drop policy if exists "Members view usage history" on public.link_usage_history;
create policy "Members view usage history" on public.link_usage_history
for select to authenticated
using (exists (select 1 from public.links l where l.id = link_usage_history.link_id and public.is_group_member(l.group_id)));

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
grant select, insert on public.group_join_requests to authenticated;
grant select, insert, update, delete on public.group_invitations to authenticated;
grant select, insert, update, delete on public.links to authenticated;
grant select on public.link_locks, public.link_usage_history to authenticated;
grant execute on function public.request_to_join_group(uuid) to authenticated;
grant execute on function public.review_group_join_request(uuid, boolean) to authenticated;
grant execute on function public.accept_group_invitation(uuid) to authenticated;
grant execute on function public.claim_link(uuid) to authenticated;
grant execute on function public.release_link(uuid) to authenticated;

-- Enable realtime for link state and membership workflow updates.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'link_locks'
  ) then
    alter publication supabase_realtime add table public.link_locks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'links'
  ) then
    alter publication supabase_realtime add table public.links;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_join_requests'
  ) then
    alter publication supabase_realtime add table public.group_join_requests;
  end if;
end;
$$;
