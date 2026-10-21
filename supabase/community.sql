-- Run once in Supabase SQL Editor. These tables are only accessed via Netlify server functions.
create extension if not exists pgcrypto;
create table if not exists public.gic_players (
 id uuid primary key default gen_random_uuid(),
 nickname varchar(20) not null unique,
 token_hash text not null unique,
 equity numeric not null default 2500,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.gic_likes (
 voter_id uuid not null references public.gic_players(id) on delete cascade,
 player_id uuid not null references public.gic_players(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(voter_id,player_id),
 check(voter_id <> player_id)
);
create table if not exists public.gic_chat (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.gic_players(id) on delete cascade,
 nickname varchar(20) not null,
 message varchar(160) not null,
 created_at timestamptz not null default now()
);
create index if not exists gic_players_updated_idx on public.gic_players(updated_at desc);
create index if not exists gic_chat_latest_idx on public.gic_chat(created_at desc);
alter table public.gic_players enable row level security;
alter table public.gic_likes enable row level security;
alter table public.gic_chat enable row level security;
-- No public RLS policies. Service-role credentials live ONLY in Netlify env, never the browser.
