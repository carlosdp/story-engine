create table storylines (
  id uuid primary key not null default gen_random_uuid(),
  world_id uuid references worlds(id) not null,
  storyteller_id uuid references thought_processes(id) not null,
  prompt text not null,
  name varchar,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table storyline_stories (
  id uuid primary key not null default gen_random_uuid(),
  storyline_id uuid references storylines(id) not null,
  text text not null,
  created_at timestamp with time zone default now() not null
);

create table storyline_characters (
  id uuid primary key not null default gen_random_uuid(),
  storyline_id uuid references storylines(id) not null,
  character_id uuid references characters(id) not null,
  created_at timestamp with time zone default now() not null
);