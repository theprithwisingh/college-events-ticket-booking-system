create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

revoke execute on function public.get_my_role() from public;
grant execute on function public.get_my_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.bookings enable row level security;
alter table public.tickets enable row level security;

create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid() or public.get_my_role() = 'ADMIN')
with check (id = auth.uid() or public.get_my_role() = 'ADMIN');

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.get_my_role() <> 'ADMIN' then
    raise exception 'Only admins may change profile roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
before update of role on public.profiles
for each row
execute function public.protect_profile_role();

create policy events_select on public.events
for select to authenticated
using (
  is_published
  or public.get_my_role() in ('VOLUNTEER', 'ADMIN')
);

create policy events_write on public.events
for all to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy ticket_tiers_select on public.ticket_tiers
for select to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and (events.is_published or public.get_my_role() = 'ADMIN')
  )
);

create policy ticket_tiers_write on public.ticket_tiers
for all to authenticated
using (public.get_my_role() = 'ADMIN')
with check (public.get_my_role() = 'ADMIN');

create policy bookings_select on public.bookings
for select to authenticated
using (
  buyer_id = auth.uid()
  or public.get_my_role() = 'ADMIN'
);

create policy bookings_insert on public.bookings
for insert to authenticated
with check (
  buyer_id = auth.uid()
  or public.get_my_role() = 'ADMIN'
);

create policy bookings_update on public.bookings
for update to authenticated
using (
  buyer_id = auth.uid()
  or public.get_my_role() = 'ADMIN'
)
with check (
  buyer_id = auth.uid()
  or public.get_my_role() = 'ADMIN'
);

create policy bookings_delete on public.bookings
for delete to authenticated
using (public.get_my_role() = 'ADMIN');

create policy tickets_select on public.tickets
for select to authenticated
using (
  public.get_my_role() = 'ADMIN'
  or public.get_my_role() = 'VOLUNTEER'
  or exists (
    select 1
    from public.bookings
    where bookings.id = tickets.booking_id
      and bookings.buyer_id = auth.uid()
  )
);

create policy tickets_update on public.tickets
for update to authenticated
using (
  public.get_my_role() in ('VOLUNTEER', 'ADMIN')
)
with check (
  public.get_my_role() in ('VOLUNTEER', 'ADMIN')
);

create policy tickets_delete on public.tickets
for delete to authenticated
using (public.get_my_role() = 'ADMIN');

create policy tickets_insert on public.tickets
for insert to authenticated
with check (public.get_my_role() = 'ADMIN');

grant select, insert, update, delete on
  public.profiles,
  public.events,
  public.ticket_tiers,
  public.bookings,
  public.tickets
to authenticated;
