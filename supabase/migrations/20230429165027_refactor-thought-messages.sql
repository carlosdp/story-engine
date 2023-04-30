create table thought_process_messages (
  id uuid primary key default gen_random_uuid(),
  thought_process_id uuid not null references thought_processes(id),
  role varchar not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table thought_process_messages enable row level security;

create policy "Staff can read thought process messages" on thought_process_messages for select using (auth.uid() in (select user_id from profiles where is_staff = true));

alter table thought_processes drop column messages;
