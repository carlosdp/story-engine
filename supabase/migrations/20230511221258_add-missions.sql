create table missions (
  id uuid primary key not null default gen_random_uuid(),
  storyline_id uuid not null references storylines(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table mission_characters (
  mission_id uuid not null references missions(id),
  character_id uuid not null references characters(id),
  primary key (mission_id, character_id),
  created_at timestamp with time zone default now() not null
);

create table mission_objectives (
  id uuid primary key not null default gen_random_uuid(),
  mission_id uuid not null references missions(id),
  prerequisite_id uuid references mission_objectives(id),
  instructions text not null,
  data jsonb not null,
  created_at timestamp with time zone not null default now()
);

-- a postgres function that returns each mission with all characters as a jsonb column and objectives as a jsonb column
create or replace function hydrated_missions()
returns table (
  id uuid,
  storyline_id uuid,
  characters jsonb,
  objectives jsonb
) as $$
  select
    m.id,
    m.storyline_id,
    jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name)) as characters,
    jsonb_agg(jsonb_build_object('id', o.id, 'instructions', o.instructions, 'data', o.data)) as objectives
  from missions m
  left join mission_characters mc on mc.mission_id = m.id
  left join characters c on c.id = mc.character_id
  left join mission_objectives o on o.mission_id = m.id
  group by m.id
$$ language sql stable;