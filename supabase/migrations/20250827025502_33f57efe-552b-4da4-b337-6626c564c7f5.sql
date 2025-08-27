-- Create social_connections table for FB Pages and IG accounts
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,             -- 'facebook' | 'instagram'
  external_id text not null,          -- page_id or ig_user_id
  name text not null,                 -- page name or ig username
  access_token text not null,         -- page access token (FB) or page access token used for IG calls
  meta jsonb default '{}'::jsonb,     -- { page_id: "...", ig_user_id: "...", username: "...", ... }
  connected_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

-- Enable RLS
alter table public.social_connections enable row level security;

-- Create policy for users to manage their own connections
create policy "Users can manage their own social connections"
on public.social_connections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);