-- The personal site shows a list of agency projects, a few of them highlighted on the home page.

alter table personal.featured_projects rename to project_showcase;

alter table personal.project_showcase
  add column highlighted boolean not null default false;

alter trigger featured_projects_set_updated_at on personal.project_showcase
  rename to project_showcase_set_updated_at;

alter policy "Public read featured projects" on personal.project_showcase
  rename to "Public read project showcase";
alter policy "Admins manage featured projects" on personal.project_showcase
  rename to "Admins manage project showcase";

create index project_showcase_order_idx on personal.project_showcase (highlighted desc, position);
