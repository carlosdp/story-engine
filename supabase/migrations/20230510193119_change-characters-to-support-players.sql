alter table characters drop column rust_npc_type;
alter table characters drop column first_name;
alter table characters drop column last_name;
alter table characters drop column title;

alter table characters add column name varchar not null;
alter table characters add column description varchar not null;
alter table characters add column embedding vector(1536) not null;

create table players (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id),
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);