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

create or replace function related_characters(p_character_id uuid)
returns table(
  id uuid,
  rust_npc_type varchar,
  first_name varchar,
  last_name varchar,
  title varchar,
  backstory text,
  personality text,
  writing_style text,
  created_at timestamptz,
  updated_at timestamptz,
  relationship_type varchar,
  description_of_interactions text
) as $$
begin
  return query
  select
    c.id,
    c.rust_npc_type,
    c.first_name,
    c.last_name,
    c.title,
    c.backstory,
    c.personality,
    c.writing_style,
    c.created_at,
    c.updated_at,
    cr.relationship_type,
    cr.description_of_interactions
  from
    character_relationships cr
    join characters c on (cr.related_character_id = c.id and cr.character_id = p_character_id) or
                         (cr.character_id = c.id and cr.related_character_id = p_character_id)
  where
    cr.character_id = p_character_id or cr.related_character_id = p_character_id;
end; $$
language plpgsql;
