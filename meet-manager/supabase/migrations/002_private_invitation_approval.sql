alter table public.groups alter column is_discoverable set default false;
update public.groups set is_discoverable = false;
drop policy if exists "Discoverable groups and member groups visible" on public.groups;
create policy "Members view their private groups" on public.groups for select to authenticated using (public.is_group_member(id));
alter table public.group_invitations add column if not exists invite_token uuid not null default gen_random_uuid();
alter table public.group_join_requests add column if not exists invitation_id uuid references public.group_invitations(id) on delete set null;
alter table public.group_invitations drop constraint if exists group_invitations_status_check;
alter table public.group_invitations add constraint group_invitations_status_check check (status in ('pending','requested','accepted','revoked'));
create unique index if not exists group_invitations_token_unique on public.group_invitations(invite_token);
drop policy if exists "Users create own requests for discoverable groups" on public.group_join_requests;
create policy "No direct join request inserts" on public.group_join_requests for insert to authenticated with check (false);
create or replace function public.request_to_join_group(p_group_id uuid) returns uuid language plpgsql security definer set search_path = public, auth as $$ begin raise exception 'Private groups require an invitation'; end; $$;
revoke all on function public.request_to_join_group(uuid) from public, authenticated;
revoke all on function public.accept_group_invitation(uuid) from public, authenticated;
create or replace function public.get_invitation_preview(p_token uuid)
returns table (group_name text, invited_email text) language plpgsql stable security definer set search_path = '' as $$
begin return query select g.name, i.email from public.group_invitations i join public.groups g on g.id=i.group_id where i.invite_token=p_token and i.status='pending'; end; $$;
create or replace function public.request_to_join_by_invitation(p_token uuid) returns uuid language plpgsql security definer set search_path = public, auth as $$
declare v_invitation public.group_invitations%rowtype; v_request_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into v_invitation from public.group_invitations where invite_token=p_token and status='pending' and lower(email)=lower(coalesce(auth.jwt()->>'email','')) for update;
 if v_invitation.id is null then raise exception 'Invitation is invalid or email does not match'; end if;
 if exists(select 1 from public.group_members where group_id=v_invitation.group_id and user_id=auth.uid()) then raise exception 'Already a member'; end if;
 insert into public.group_join_requests(group_id,user_id,invitation_id) values(v_invitation.group_id,auth.uid(),v_invitation.id)
 on conflict(group_id,user_id) where status='pending' do nothing returning id into v_request_id;
 if v_request_id is null then select id into v_request_id from public.group_join_requests where group_id=v_invitation.group_id and user_id=auth.uid() and status='pending'; end if;
 update public.group_invitations set status='requested' where id=v_invitation.id;
 return v_request_id;
end; $$;
create or replace function public.review_group_join_request(p_request_id uuid,p_approve boolean) returns void language plpgsql security definer set search_path=public,auth as $$
declare v_group_id uuid; v_user_id uuid; v_invitation_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select r.group_id,r.user_id,r.invitation_id into v_group_id,v_user_id,v_invitation_id from public.group_join_requests r join public.groups g on g.id=r.group_id where r.id=p_request_id and g.owner_id=auth.uid() and r.status='pending' for update of r;
 if v_group_id is null then raise exception 'Request not found or permission denied'; end if;
 update public.group_join_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now(),reviewed_by=auth.uid() where id=p_request_id;
 if p_approve then
  insert into public.group_members(group_id,user_id,role) values(v_group_id,v_user_id,'member') on conflict(group_id,user_id) do nothing;
  if v_invitation_id is not null then update public.group_invitations set status='accepted',accepted_at=now() where id=v_invitation_id; end if;
 elsif v_invitation_id is not null then update public.group_invitations set status='pending' where id=v_invitation_id;
 end if;
end; $$;
grant execute on function public.get_invitation_preview(uuid) to anon,authenticated;
grant execute on function public.request_to_join_by_invitation(uuid) to authenticated;
grant execute on function public.review_group_join_request(uuid,boolean) to authenticated;
drop policy if exists "Profiles visible to self and group peers" on public.profiles;
create policy "Profiles visible to self, group peers and request owners" on public.profiles for select to authenticated using (
 id=(select auth.uid()) or public.is_group_peer(id) or exists(select 1 from public.group_join_requests r where r.user_id=profiles.id and r.status='pending' and public.is_group_owner(r.group_id))
);