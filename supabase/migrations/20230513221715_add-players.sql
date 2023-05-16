create table players (
  id uuid primary key not null default gen_random_uuid(),
  world_id uuid not null references worlds(id),
  name text not null,
  character_id uuid references characters(id),
  created_at timestamp with time zone default now() not null
);

-- get player by name, or if doesn't exist, create it and insert a record into job table to create character
create or replace function get_player_by_name(player_world_id uuid, player_name text) returns players as $$
  declare
    player players;
  begin
    select * into player from players where players.name = player_name and players.world_id = player_world_id;
    if not found then
      insert into players (world_id, name) values (player_world_id, player_name) returning * into player;
      insert into signals (world_id, subsystem, direction, payload) values (player_world_id, 'playerStarter', 'in', json_build_object('playerId', player.id, 'command', 'Create a character and starter mission for this player'));
    end if;
    return player;
  end;
$$ language plpgsql;

create view players_with_characters as
  select players.id as player_id, players.name as player_name, characters.* from players left join characters on characters.id = players.character_id;