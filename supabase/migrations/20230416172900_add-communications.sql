create type direction as enum ('in', 'out');
create type message_type as enum ('command', 'response', 'signal', 'communication');

create table thought_processes (
  id uuid primary key default gen_random_uuid(),
  initiating_message_id uuid not null,
  parent_thought_process_id uuid references thought_processes(id),
  subsystem varchar not null,
  messages jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create type action_status as enum ('pending', 'waiting', 'complete', 'failed');

create table thought_process_actions (
  id uuid primary key default gen_random_uuid(),
  thought_process_id uuid references thought_processes(id),
  status action_status not null default 'pending',
  action varchar not null,
  parameters jsonb not null,
  data jsonb,
  result text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  type message_type not null,
  response_to uuid references messages(id),
  from_action_id uuid references thought_process_actions(id),
  direction direction not null,
  subsystem varchar not null,
  from_subsystem varchar,
  payload jsonb not null,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create view queued_messages as
  select * from messages
  where acknowledged_at is null;

create or replace function acknowledge_messages(ids uuid[])
  returns void as $$
  begin
    update messages
    set acknowledged_at = now()
    where id = any(ids);
  end;
$$ language plpgsql;
