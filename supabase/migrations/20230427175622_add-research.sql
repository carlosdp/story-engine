create table researchables (
  id uuid not null primary key default gen_random_uuid(),
  depends_on uuid references researchables(id),
  name text not null,
  description text not null,
  time_required interval not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table research_sessions (
  id uuid not null primary key default gen_random_uuid(),
  research_id uuid not null references researchables(id),
  started_at timestamp with time zone not null default now(),
  stopped_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table researchables enable row level security;
alter table research_sessions enable row level security;

create policy "Staff can read researchables" on researchables for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can read research_sessions" on research_sessions for select using (auth.uid() in (select user_id from profiles where is_staff = true));

-- only one research session can be active at a time
create unique index research_sessions_active_idx on research_sessions (research_id) where stopped_at is null;

-- select researchables where the sum of research sessions is greater or equal to the time_required
create view completed_researchables as
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
