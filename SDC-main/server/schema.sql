-- ============================================================
-- SDC DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- ── 0. USER PROFILES & ROLES (STORED IN DATABASE TABLE) ──────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('member','admin')),
  approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected')),
  member_type text not null default 'university'
    check (member_type in ('university','external')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 1. Users can read only their own row
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Helper security definer function to avoid recursive RLS evaluation on profiles
create or replace function public.is_approved_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and approval_status = 'approved'
  );
$$;

-- 2. Approved Admins can read all profiles (uses security definer function to prevent infinite RLS recursion)
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select using (public.is_approved_admin());

-- 3. Users may update only harmless fields, never role or approval_status
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists "update own name" on public.profiles;
create policy "update own name" on public.profiles
  for update using (auth.uid() = id);

-- 4. Clients can NEVER insert or delete rows directly (handled via security definer trigger)
revoke insert, delete on public.profiles from anon, authenticated;

drop policy if exists "Deny client inserts on profiles" on public.profiles;
create policy "Deny client inserts on profiles" on public.profiles
  for insert with check (false);

drop policy if exists "Deny client deletes on profiles" on public.profiles;
create policy "Deny client deletes on profiles" on public.profiles
  for delete using (false);

-- ── 0b. SIGN-UP TRIGGER (ALWAYS DEFAULT TO MEMBER & PENDING) ──
-- Create profile with a trigger on sign-up that always sets:
-- role = 'member' and approval_status = 'pending',
-- completely ignoring anything the client sends.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_univ boolean;
  m_type text;
begin
  -- Automatically classify member_type: ONLY @goa.paruluniversity.ac.in is university, rest all are external
  is_univ := (new.email ~* '@goa\.paruluniversity\.ac\.in$');
  if is_univ then
    m_type := 'university';
  else
    m_type := 'external';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    approval_status,
    member_type
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member',          -- always member on signup, ignoring client claims
    'pending',         -- always pending on signup
    m_type
  )
  on conflict (id) do update set
    email = excluded.email;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 0c. ADMIN AUDIT LOGS ─────────────────────────────────────
-- Log every administrative action (who approved or deleted what, and when)
create table if not exists public.admin_audit_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references auth.users(id) on delete set null,
  admin_email   text not null,
  action        text not null,
  target_type   text not null,
  target_id     text,
  details       jsonb default '{}'::jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.is_approved_admin());


-- ── 0d. EVENT REGISTRATIONS (GATED IN DATABASE BY APPROVAL_STATUS) ──
create table if not exists public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text default 'registered' check (status in ('registered', 'attended', 'cancelled')),
  created_at  timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_registrations enable row level security;

-- Only APPROVED members can register for events! Pending members CANNOT insert!
drop policy if exists "Only approved members can register for events" on public.event_registrations;
create policy "Only approved members can register for events"
  on public.event_registrations
  for insert
  to authenticated
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and approval_status = 'approved'
    )
  );

drop policy if exists "Users can view their own event registrations" on public.event_registrations;
create policy "Users can view their own event registrations"
  on public.event_registrations
  for select
  to authenticated
  using (auth.uid() = user_id);


-- ── 1. PROJECTS ─────────────────────────────────────────────
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  github_url    text,
  submitted_by  text,
  status        text default 'pending' check (status in ('pending','approved','rejected')),
  tags          text[] default '{}',
  is_featured   boolean default false,
  created_at    timestamptz default now()
);

-- RLS: Projects
alter table projects enable row level security;

drop policy if exists "Public can view approved projects" on projects;
create policy "Public can view approved projects"
  on projects for select
  using (status = 'approved' or auth.role() = 'authenticated');

-- Gated in Database: Only approved members can submit projects
drop policy if exists "Authenticated users can submit projects" on projects;
drop policy if exists "Only approved members can submit projects" on projects;
create policy "Only approved members can submit projects"
  on projects for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and approval_status = 'approved'
    )
  );

drop policy if exists "Users can update their own pending submissions" on projects;
create policy "Users can update their own pending submissions"
  on projects for update
  to authenticated
  using (auth.jwt() ->> 'email' = submitted_by);


-- ── 2. EVENTS ───────────────────────────────────────────────
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  category      text default 'Workshops' check (category in ('Workshops','Hackathons','Talks','Social')),
  event_date    timestamptz,
  location      text,
  spots_left    int default 30,
  featured      boolean default false,
  href          text default '#/events',
  created_at    timestamptz default now()
);

-- RLS: Events
alter table events enable row level security;

drop policy if exists "Public can view events" on events;
create policy "Public can view events"
  on events for select
  using (true);


-- ── 3. BLOGS ────────────────────────────────────────────────
create table if not exists blogs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  excerpt       text,
  content       text,
  author        text,
  tag           text default 'Community',
  read_time     text default '3 min read',
  image_url     text,
  photos        text[] default '{}',
  published_at  timestamptz default now()
);

alter table blogs add column if not exists image_url text;
alter table blogs add column if not exists photos text[] default '{}';

-- RLS: Blogs
alter table blogs enable row level security;

drop policy if exists "Public can view blogs" on blogs;
create policy "Public can view blogs"
  on blogs for select
  using (true);


-- ── 4. MEMBERS ──────────────────────────────────────────────
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null,
  role          text,
  initials      text,
  member_type   text default 'student' check (member_type in ('faculty','student')),
  dept          text,
  sort_order    int default 99,
  created_at    timestamptz default now()
);

alter table members add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists idx_members_user_id on members(user_id) where user_id is not null;

-- RLS: Members
alter table members enable row level security;

drop policy if exists "Public can view members" on members;
create policy "Public can view members"
  on members for select
  using (true);


-- ── 5. STATS ────────────────────────────────────────────────
create table if not exists stats (
  id              uuid primary key default gen_random_uuid(),
  active_members  text default '150+',
  workshops_run   text default '24+',
  projects_shipped text default '35+',
  events_organized text default '12+',
  hackathons_won  text default '12+',
  updated_at      timestamptz default now()
);

-- RLS: Stats
alter table stats enable row level security;

drop policy if exists "Public can view stats" on stats;
create policy "Public can view stats"
  on stats for select
  using (true);


-- ── 6. MEMBER VOICES ────────────────────────────────────────
create table if not exists voices (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  name        text not null,
  year        text,
  initials    text,
  sort_order  int default 99,
  created_at  timestamptz default now()
);

-- RLS: Voices
alter table voices enable row level security;

drop policy if exists "Public can view voices" on voices;
create policy "Public can view voices"
  on voices for select
  using (true);


-- ── 7. FAQs ─────────────────────────────────────────────────
create table if not exists faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  sort_order  int default 99,
  created_at  timestamptz default now()
);

-- RLS: FAQs
alter table faqs enable row level security;

drop policy if exists "Public can view faqs" on faqs;
create policy "Public can view faqs"
  on faqs for select
  using (true);


-- ── 8. ANNOUNCEMENTS ────────────────────────────────────────
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  headline    text not null,
  category    text default 'General' check (category in ('Workshop','Hackathon','Urgent','General')),
  message     text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- RLS: Announcements
alter table announcements enable row level security;

drop policy if exists "Public can view active announcements" on announcements;
create policy "Public can view active announcements"
  on announcements for select
  using (is_active = true or auth.role() = 'authenticated');


-- ============================================================
-- ONE-TIME ADMIN SETUP (Run by hand once in Supabase SQL Editor):
-- Elevate verified coordinators to admins. The email list is only
-- a one-time setup step and is NEVER checked at runtime.
-- ============================================================
-- update public.profiles
-- set role = 'admin', approval_status = 'approved'
-- where email in (
--   'admin@sdc.club',
--   '2501011010045@goa.paruluniversity.ac.in', -- Raziya Sultana
--   '2501011010073@goa.paruluniversity.ac.in', -- Tanishq Naik
--   '2501011010066@goa.paruluniversity.ac.in', -- Shriyansh Narvekar
--   '2501011010083@goa.paruluniversity.ac.in', -- Yash Mukade
--   '2501011010087@goa.paruluniversity.ac.in', -- Priyal Nagvekar
--   '2501011010012@goa.paruluniversity.ac.in', -- Abhimanyu Dixit
--   '2501011010062@goa.paruluniversity.ac.in', -- Shravan Bhise
--   '2503031010009@goa.paruluniversity.ac.in'  -- Aaryan Kumar Tiwari
-- );
