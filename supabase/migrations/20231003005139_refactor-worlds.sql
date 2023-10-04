alter table worlds add column description text not null;
alter table worlds drop column type;
-- change profiles table, make is_staff default true (temporary)
alter table profiles alter column is_staff set default true;

create table scenarios (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  description text not null,
  world_id uuid references worlds(id) not null,
  created_at timestamp with time zone not null default now()
);

alter table storylines add column scenario_id uuid references scenarios(id);

create or replace function create_world (name varchar, description text) returns worlds as $$
  insert into worlds (name, description)
  values ($1, $2)
  returning *;
$$ language sql;
