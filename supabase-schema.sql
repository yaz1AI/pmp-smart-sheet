-- AI PM Smart Sheet: run this once in Supabase SQL Editor.
-- Every policy below uses auth.uid(), so projects remain private to the signed-in user.
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_name text not null,
  project_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Users manage their own projects" on public.projects;
create policy "Users manage their own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists projects_user_updated_idx on public.projects (user_id, updated_at desc);

-- In Authentication > URL Configuration, add your production URL and localhost
-- redirect URLs before enabling magic-link sign-in.

