create table character_conversations (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references worlds(id),
  source_character_id uuid not null references characters(id),
  target_character_id uuid not null references characters(id),
  type varchar not null,
  data jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table character_conversations enable row level security;
create policy "Staff can read character conversations" on character_conversations for select using (auth.uid() in (select user_id from profiles where is_staff = true));

drop table letters;