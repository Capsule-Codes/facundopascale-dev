-- Personal site content for facundopascale.dev, hosted in the Capsule Codes project.
-- public.products is shared with capsulecodes.com; everything else lives in the personal schema.

create schema if not exists personal;

grant usage on schema personal to anon, authenticated, service_role;

-- Admins ---------------------------------------------------------------------

create table personal.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function personal.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from personal.admins a where a.user_id = auth.uid());
$$;

grant execute on function personal.is_admin() to anon, authenticated;

create or replace function personal.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Shared products ------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  translations jsonb not null default
    '{"es": {"tagline": "", "description": ""}, "en": {"tagline": "", "description": ""}, "it": {"tagline": "", "description": ""}}'::jsonb,
  status text not null default 'idea' check (status in ('idea', 'beta', 'live', 'sunset')),
  url text,
  logo text,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  show_on_personal boolean not null default false,
  show_on_agency boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function personal.set_updated_at();

alter table public.products enable row level security;

create policy "Public read visible products" on public.products
  for select using (show_on_personal or show_on_agency);

create policy "Personal admins manage products" on public.products
  for all to authenticated
  using (personal.is_admin()) with check (personal.is_admin());

-- Featured agency projects ---------------------------------------------------

create table personal.featured_projects (
  project_id uuid primary key references public.projects (id) on delete cascade,
  position integer not null default 0,
  translations jsonb not null default
    '{"es": {"summary": ""}, "en": {"summary": ""}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger featured_projects_set_updated_at
  before update on personal.featured_projects
  for each row execute function personal.set_updated_at();

-- Content calendar -----------------------------------------------------------

create table personal.content_items (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('youtube', 'instagram', 'linkedin', 'newsletter', 'blog', 'ship')),
  status text not null default 'idea' check (status in ('idea', 'planned', 'drafting', 'scheduled', 'published')),
  title text not null,
  body text,
  locale text not null default 'es' check (locale in ('es', 'en')),
  scheduled_for timestamptz,
  published_at timestamptz,
  url text,
  product_id uuid references public.products (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  show_in_log boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_items_have_date check (status <> 'published' or published_at is not null)
);

create index content_items_calendar_idx on personal.content_items (status, scheduled_for);
create index content_items_log_idx on personal.content_items (published_at desc)
  where status = 'published' and show_in_log;

create trigger content_items_set_updated_at
  before update on personal.content_items
  for each row execute function personal.set_updated_at();

-- Site settings (singleton) --------------------------------------------------

create table personal.site_settings (
  id smallint primary key default 1 check (id = 1),
  email text,
  socials jsonb not null default '{}'::jsonb,
  translations jsonb not null default
    '{"es": {"bio": ""}, "en": {"bio": ""}}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on personal.site_settings
  for each row execute function personal.set_updated_at();

insert into personal.site_settings (id) values (1);

-- Grants and RLS for the personal schema -------------------------------------

grant select on all tables in schema personal to anon, authenticated;
grant insert, update, delete on all tables in schema personal to authenticated;
grant all on all tables in schema personal to service_role;

alter table personal.admins enable row level security;
alter table personal.featured_projects enable row level security;
alter table personal.content_items enable row level security;
alter table personal.site_settings enable row level security;

create policy "Admins read admins" on personal.admins
  for select to authenticated using (personal.is_admin());

create policy "Public read featured projects" on personal.featured_projects
  for select using (true);
create policy "Admins manage featured projects" on personal.featured_projects
  for all to authenticated using (personal.is_admin()) with check (personal.is_admin());

create policy "Public read published log" on personal.content_items
  for select using (status = 'published' and show_in_log);
create policy "Admins manage content" on personal.content_items
  for all to authenticated using (personal.is_admin()) with check (personal.is_admin());

create policy "Public read site settings" on personal.site_settings
  for select using (true);
create policy "Admins update site settings" on personal.site_settings
  for update to authenticated using (personal.is_admin()) with check (personal.is_admin());
