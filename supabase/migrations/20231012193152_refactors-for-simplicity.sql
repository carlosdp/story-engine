-- store TP metadata in TP rows
alter table thought_processes add column data jsonb not null default '{}';
alter table storylines drop column storyteller_id;
