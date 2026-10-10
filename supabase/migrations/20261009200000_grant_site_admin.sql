-- Grants /admin access to the dedicated personal-site Auth user (not the shared capsulecodes.com admin).
-- The user is created through the Auth Admin API; credentials never live in this repo.

insert into personal.admins (user_id)
values ('be366fe0-f9cf-4c8f-9507-7325cd9e786e')
on conflict (user_id) do nothing;
