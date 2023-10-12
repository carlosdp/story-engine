create or replace function createCharacter(storyline_id uuid)
returns uuid
as $$
declare
    character_id uuid;
begin
    character_id := uuid_generate_v4();
    insert into jobs (name, data) values ('createCharacter', json_build_object('characterId', character_id, 'storylineId', storyline_id));
    return character_id;
end;
$$ language plpgsql;

alter table thought_processes add column data jsonb not null default '{}';
alter table storylines drop column storyteller_id;
