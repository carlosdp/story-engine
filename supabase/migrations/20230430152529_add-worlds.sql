create table worlds (
  id uuid primary key not null default gen_random_uuid(),
  name varchar not null,
  type varchar not null,
  settings jsonb not null default '{}',
  state jsonb not null default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table worlds enable row level security;

create policy "Staff can read worlds" on worlds for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can insert worlds" on worlds for insert with check (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can update worlds" on worlds for update using (auth.uid() in (select user_id from profiles where is_staff = true)) with check (auth.uid() in (select user_id from profiles where is_staff = true));

alter table thought_processes add column world_id uuid references worlds(id) not null;
alter table messages add column world_id uuid references worlds(id) not null;
alter table characters add column world_id uuid references worlds(id) not null;
alter table observations add column world_id uuid references worlds(id) not null;
alter table researchables add column world_id uuid references worlds(id) not null;
alter table letters add column world_id uuid references worlds(id) not null;

-- replace these so they have a world_id
drop view queued_messages;
drop function switch_research(uuid);
drop view available_researchables;
drop view completed_researchables;

create or replace view queued_messages as
  select * from messages
  where acknowledged_at is null;

-- select researchables where the sum of research sessions is greater or equal to the time_required
create or replace view completed_researchables as
  select researchables.*
  from researchables
  join (
    select research_id, sum(coalesce(stopped_at, now()) - started_at) as total_time 
    from research_sessions
    group by research_id
  ) as research_sessions on research_sessions.research_id = researchables.id
  where researchables.time_required <= research_sessions.total_time;

-- select researchables that are not completed, but their dependencies are, or they have no dependencies
create or replace view available_researchables as
  select r.*,
         active_sessions.research_id is not null as active,
         now() + (r.time_required - coalesce(summed_sessions.total_time, '00:00:00'::interval)) as finish_time
  from researchables r
  left join (
    select research_sessions.research_id
    from research_sessions
    where stopped_at is null
  ) as active_sessions on active_sessions.research_id = r.id
  left join (
    select research_sessions.research_id, sum(age(stopped_at, started_at)) as total_time
    from research_sessions
    group by research_sessions.research_id
  ) as summed_sessions on summed_sessions.research_id = r.id
  where r.id not in (select completed_researchables.id from completed_researchables)
  and (r.depends_on is null or r.depends_on in (select completed_researchables.id from completed_researchables));

-- function to switch active research, only allows it if the research is available
create or replace function switch_research(research_id uuid) returns void as $$
  begin
    update research_sessions
    set stopped_at = now()
    where stopped_at is null;

    insert into research_sessions (research_id)
    select research_id
    from available_researchables
    where research_id = $1;
  end;
$$ language plpgsql;
