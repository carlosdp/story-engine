create table entities (
  id uuid primary key not null default gen_random_uuid(),
  world_id uuid references worlds(id) not null,
  name varchar not null,
  description text not null,
  classification varchar not null,
  embedding vector(1536) not null,
  state text not null,
  change_history text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table rules (
  id uuid primary key not null default gen_random_uuid(),
  world_id uuid references worlds(id) not null,
  description text not null,
  plain text not null,
  embedding vector(1536) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table stories (
  id uuid primary key not null default gen_random_uuid(),
  world_id uuid references worlds(id) not null,
  text text not null,
  embedding vector(1536) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table worlds add column phases jsonb not null default '{}'::jsonb;
