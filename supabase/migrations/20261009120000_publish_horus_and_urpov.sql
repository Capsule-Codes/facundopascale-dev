-- Attach screenshots to Horus Surgical and UR POV and publish them (personal site and capsulecodes.com).
-- Horus screenshots come from a local run with synthetic demo data; the UR POV cover uses the app's own brand assets.

with media (title, file, width, height, size_bytes, sort_order) as (
  values
    ('Horus Surgical', '467a1c9f-03ab-4356-ae1d-770be4a7e0e6', 1920, 1200, 60934, 0),
    ('Horus Surgical', '6453d52a-ceb2-4ab0-967c-cbd1c618c9d7', 1920, 1200, 26714, 1),
    ('Horus Surgical', '7df931e1-62ab-4723-be95-fd0ee99e63e5', 1920, 1200, 52862, 2),
    ('UR POV', '0e90b10a-09da-4dfa-997e-626fddf19e47', 1600, 1000, 38838, 0)
),
resolved as (
  select
    p.id,
    m.sort_order,
    'https://qijznxwebaukhrkqkbdn.supabase.co/storage/v1/object/public/images/projects/'
      || p.id || '/' || m.file || '.webp' as url,
    jsonb_build_object(
      'alt', p.title,
      'width', m.width,
      'height', m.height,
      'blobKey', 'https://qijznxwebaukhrkqkbdn.supabase.co/storage/v1/object/public/images/projects/'
        || p.id || '/' || m.file || '.webp',
      'mediaId', gen_random_uuid(),
      'mimeType', 'image/webp',
      'createdAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'sizeBytes', m.size_bytes,
      'sortOrder', m.sort_order
    ) as entry
  from media m
  join public.projects p on p.title = m.title
)
update public.projects p
set
  image = (select r.url from resolved r where r.id = p.id and r.sort_order = 0),
  images = (select jsonb_agg(r.entry order by r.sort_order) from resolved r where r.id = p.id),
  published = true
where p.id in (select id from resolved);
