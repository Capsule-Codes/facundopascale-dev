-- Event-driven rebuilds for facundopascale.dev (replaces the hourly Vercel cron).
-- Any change to content the site renders POSTs the Vercel deploy hook. The hook URL is a secret kept in
-- Supabase Vault under `facundopascale_deploy_hook`; until it exists the trigger does nothing.
-- Scheduled content is published by pg_cron, which in turn fires the rebuild.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create or replace function personal.request_site_rebuild()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hook_url text;
begin
  select ds.decrypted_secret into hook_url
  from vault.decrypted_secrets ds
  where ds.name = 'facundopascale_deploy_hook'
  limit 1;

  if hook_url is not null and hook_url <> '' then
    perform net.http_post(url := hook_url, body := '{}'::jsonb);
  end if;

  return null;
end;
$$;

revoke execute on function personal.request_site_rebuild() from public, anon, authenticated;

-- Statement-level triggers: one rebuild request per statement, not per row.
create trigger projects_request_site_rebuild
  after insert or update or delete on public.projects
  for each statement execute function personal.request_site_rebuild();

create trigger products_request_site_rebuild
  after insert or update or delete on public.products
  for each statement execute function personal.request_site_rebuild();

create trigger reviews_request_site_rebuild
  after insert or update or delete on public.reviews
  for each statement execute function personal.request_site_rebuild();

create trigger project_showcase_request_site_rebuild
  after insert or update or delete on personal.project_showcase
  for each statement execute function personal.request_site_rebuild();

create trigger content_items_request_site_rebuild
  after insert or update or delete on personal.content_items
  for each statement execute function personal.request_site_rebuild();

create trigger site_settings_request_site_rebuild
  after insert or update or delete on personal.site_settings
  for each statement execute function personal.request_site_rebuild();

-- Publishes scheduled content whose time has come. Only writes (and so only rebuilds) when something is due.
create or replace function personal.publish_due_content()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_count integer := 0;
begin
  if exists (
    select 1 from personal.content_items
    where status = 'scheduled' and scheduled_for <= now()
  ) then
    update personal.content_items
    set status = 'published', published_at = coalesce(published_at, scheduled_for)
    where status = 'scheduled' and scheduled_for <= now();
    get diagnostics published_count = row_count;
  end if;

  return published_count;
end;
$$;

revoke execute on function personal.publish_due_content() from public, anon, authenticated;

select cron.schedule(
  'personal-publish-due-content',
  '*/15 * * * *',
  'select personal.publish_due_content()'
);
