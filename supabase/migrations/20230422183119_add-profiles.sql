create table profiles (
  user_id uuid primary key references auth.users(id) not null,
  is_staff boolean not null default false,
  steam_id varchar,
  owns_rust boolean,
  rust_played_minutes_total integer,
  rust_played_minutes_recent integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles add constraint profiles_user_id_key unique (user_id);

create or replace function public.profiles_insert_trigger() returns trigger as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_insert_trigger
  after insert on auth.users
  for each row
  execute procedure public.profiles_insert_trigger();

insert into public.profiles (user_id) select id from auth.users;

drop view users;

create view users as
select
  id,
  email,
  profiles.*
from
  auth.users left join profiles on auth.users.id = profiles.user_id;
