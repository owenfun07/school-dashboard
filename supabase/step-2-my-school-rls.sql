-- Step 2: minimum Row Level Security policies for the private My School page.
-- Run this in Supabase Dashboard -> SQL Editor only after creating:
-- profiles, schools, grades, and school_memberships.

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.grades enable row level security;
alter table public.school_memberships enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can view their active memberships" on public.school_memberships;
create policy "Users can view their active memberships"
on public.school_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Members can view their school" on public.schools;
create policy "Members can view their school"
on public.schools
for select
to authenticated
using (
  exists (
    select 1
    from public.school_memberships as membership
    where membership.school_id = schools.id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

drop policy if exists "Members can view grades at their school" on public.grades;
create policy "Members can view grades at their school"
on public.grades
for select
to authenticated
using (
  exists (
    select 1
    from public.school_memberships as membership
    where membership.school_id = grades.school_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);
