-- view that exposes id and email from auth.users
create view users as
select
  id,
  email
from
  auth.users;
