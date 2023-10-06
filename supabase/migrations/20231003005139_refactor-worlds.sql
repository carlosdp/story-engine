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

-- function for getting characters in storylines for a scenario
create or replace view scenario_characters as
  select characters.*, storylines.scenario_id
  from characters
  inner join storyline_characters on storyline_characters.character_id = characters.id
  inner join storylines on storylines.id = storyline_characters.storyline_id;

create or replace function create_world (name varchar, description text) returns worlds as $$
  insert into worlds (name, description)
  values ($1, $2)
  returning *;
$$ language sql;

create or replace function create_scenario (world_id uuid, name varchar, description text) returns uuid as $$
  declare
    scenario_id uuid;
  begin
    insert into scenarios (world_id, name, description)
    values (world_id, name, description)
    returning id into scenario_id;

    insert into public.job (name, data)
    values ('createScenario', json_build_object('scenarioId', scenario_id)::json);

    return scenario_id;
  end;
$$ language plpgsql;
