-- PostgREST cannot embed across schemas, so the personal site reads the showcase through this view.
-- Only published agency projects are visible; RLS of the underlying tables still applies (security_invoker).

create view personal.showcase
with (security_invoker = true)
as
select
  p.id,
  p.title,
  p.subtitle,
  p.description,
  p.translations,
  s.translations as showcase_translations,
  p.image,
  p.images,
  p.image_orientation,
  p.technologies,
  p.category,
  p.live_url,
  p.app_store_url,
  p.play_store_url,
  s.highlighted,
  s.position
from personal.project_showcase s
join public.projects p on p.id = s.project_id
where p.published;

grant select on personal.showcase to anon, authenticated, service_role;
