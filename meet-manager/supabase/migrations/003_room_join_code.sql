-- Private rooms use one owner-defined join code. No public discovery or approval workflow.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.groups
  add column if not exists join_code_hash text;

alter table public.groups alter column is_discoverable set default false;
update public.groups set is_discoverable = false;

create unique index if not exists groups_join_code_hash_unique
  on public.groups(join_code_hash)
  where join_code_hash is not null;

create or replace function public.create_private_group(p_name text, p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Room name must contain at least 2 characters'; end if;
  if length(trim(coalesce(p_code, ''))) < 6 then raise exception 'Join code must contain at least 6 characters'; end if;

  v_hash := encode(extensions.digest(lower(trim(p_code)), 'sha256'), 'hex');
  insert into public.groups(name, owner_id, is_discoverable, join_code_hash)
  values(trim(p_name), auth.uid(), false, v_hash)
  returning id into v_group_id;

  return v_group_id;
exception
  when unique_violation then raise exception 'This join code is already used. Choose another one';
end;
$$;

create or replace function public.join_private_group(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_code, ''))) < 6 then raise exception 'Invalid room code'; end if;

  v_hash := encode(extensions.digest(lower(trim(p_code)), 'sha256'), 'hex');
  select id into v_group_id
  from public.groups
  where join_code_hash = v_hash
  limit 1;

  if v_group_id is null then raise exception 'Invalid room code'; end if;

  insert into public.group_members(group_id, user_id, role)
  values(v_group_id, auth.uid(), 'member')
  on conflict(group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

revoke all on function public.create_private_group(text, text) from public, anon;
revoke all on function public.join_private_group(text) from public, anon;
grant execute on function public.create_private_group(text, text) to authenticated;
grant execute on function public.join_private_group(text) to authenticated;

-- Disable the old invitation/approval entry points.
revoke all on function public.request_to_join_group(uuid) from public, anon, authenticated;
revoke all on function public.accept_group_invitation(uuid) from public, anon, authenticated;
revoke all on function public.get_invitation_preview(uuid) from public, anon, authenticated;
revoke all on function public.request_to_join_by_invitation(uuid) from public, anon, authenticated;
