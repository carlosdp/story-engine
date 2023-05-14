create table players (
  id uuid primary key not null default gen_random_uuid(),
  name text not null,
  character_id uuid references characters(id),
  created_at timestamp with time zone default now() not null
);

-- get player by name, or if doesn't exist, create it and insert a record into job table to create character
create or replace function get_player_by_name(player_name text) returns players as $$
  declare
    player players;
  begin
    select * into player from players where players.name = player_name;
    if not found then
      insert into players (name) values (player_name) returning * into player;
      insert into job (name, data) values ('initialize-player', json_build_object('playerId', player.id));
    end if;
    return player;
  end;
$$ language plpgsql;