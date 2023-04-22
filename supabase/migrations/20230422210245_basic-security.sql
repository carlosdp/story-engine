alter table archive enable row level security;
alter table job enable row level security;
alter table version enable row level security;
alter table schedule enable row level security;
alter table subscription enable row level security;

alter table characters enable row level security;
alter table character_relationships enable row level security;
alter table letters enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;
alter table thought_process_actions enable row level security;
alter table thought_processes enable row level security;

create policy "Users can see their own profiles, staff can see all" on profiles for select using (auth.uid() = user_id or auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see jobs" on job for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can insert jobs" on job for insert with check (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see characters" on characters for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see character relationships" on character_relationships for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see letters" on letters for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see messages" on messages for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see thought processes" on thought_processes for select using (auth.uid() in (select user_id from profiles where is_staff = true));
create policy "Staff can see thought process actions" on thought_process_actions for select using (auth.uid() in (select user_id from profiles where is_staff = true));