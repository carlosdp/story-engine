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