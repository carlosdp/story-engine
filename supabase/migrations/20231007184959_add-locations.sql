create table locations (
  id uuid primary key default gen_random_uuid(),
  world_id uuid references worlds(id) not null,
  name varchar not null,
  description text,
  backstory text,
  location POINT,
  embedding vector(1536) not null,
  created_at timestamp with time zone not null default now()
);
