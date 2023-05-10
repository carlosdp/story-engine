drop view queued_messages;
drop function acknowledge_messages(uuid[]);
drop table messages;
drop type message_type;


create table signals (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references worlds(id),
  response_to uuid references signals(id),
  from_action_id uuid references thought_process_actions(id),
  direction direction not null,
  subsystem varchar not null,
  from_subsystem varchar,
  payload jsonb not null,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

alter table signals enable row level security;
create policy "Staff can see signals" on signals for select using (auth.uid() in (select user_id from profiles where is_staff = true));

create view queued_signals as
  select * from signals
  where acknowledged_at is null;

create or replace function acknowledge_signals(ids uuid[])
  returns void as $$
  begin
    update signals
    set acknowledged_at = now()
    where id = any(ids);
  end;
$$ language plpgsql;
