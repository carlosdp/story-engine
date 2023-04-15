create table characters (
  id uuid primary key default gen_random_uuid(),
  rust_npc_type varchar not null,
  first_name varchar not null,
  last_name varchar not null,
  title varchar,
  backstory text not null,
  personality text not null,
  writing_style text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table character_relationships (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id),
  related_character_id uuid not null references characters(id),
  relationship_type varchar not null,
  description_of_interactions text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table character_relationships add constraint character_relationships_unique unique (character_id, related_character_id);