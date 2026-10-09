-- Seed products, two new agency projects (unpublished until screenshots exist) and the personal showcase.

insert into public.products (slug, name, translations, status, url, show_on_personal, position)
values
  ('stagionaly', 'Stagionaly',
   '{"es": {"tagline": "Bolsa de trabajo para la hotelería estacional italiana.", "description": "Conecta hoteles, restaurantes y beach clubs de zonas turísticas de Italia con trabajadores de temporada."},
     "en": {"tagline": "The job board for Italian seasonal hospitality.", "description": "Connects hotels, restaurants and beach clubs in Italian tourist areas with seasonal workers."},
     "it": {"tagline": "Il portale di lavoro per l''ospitalità stagionale italiana.", "description": "Mette in contatto hotel, ristoranti e stabilimenti balneari con lavoratori stagionali."}}'::jsonb,
   'live', 'https://www.stagionaly.com', true, 1),
  ('elevate', 'Elevate',
   '{"es": {"tagline": "La plataforma para coaches, nutricionistas y gimnasios.", "description": "Tres apps sobre un mismo ecosistema: Coach, Nutri y Gym. Offline-first, en mobile y escritorio."},
     "en": {"tagline": "The platform for coaches, nutritionists and gyms.", "description": "Three apps on one ecosystem: Coach, Nutri and Gym. Offline-first, on mobile and desktop."},
     "it": {"tagline": "La piattaforma per coach, nutrizionisti e palestre.", "description": "Tre app su un unico ecosistema: Coach, Nutri e Gym. Offline-first, su mobile e desktop."}}'::jsonb,
   'live', 'https://byelevate.app', true, 2),
  ('orbys', 'Orbys',
   '{"es": {"tagline": "Tu agencia, en órbita.", "description": "Clientes, proyectos, horas, facturación y reparto entre socios en un solo lugar."},
     "en": {"tagline": "Your agency, in full orbit.", "description": "Clients, projects, time tracking, billing and partner splits in one place."},
     "it": {"tagline": "La tua agenzia, in orbita.", "description": "Clienti, progetti, ore, fatturazione e soci in un unico posto."}}'::jsonb,
   'live', 'https://www.getorbys.com', true, 3);

insert into public.projects (title, subtitle, description, translations, image, technologies, live_url, category, published, show_on_home, featured)
values
  ('Horus Surgical', 'Cataract surgery patient education',
   'Patient education and IOL verification platform for cataract surgeons, with an AI counselor and biometry report cross-checks.',
   '{"en": {"title": "Horus Surgical", "description": "Patient education and IOL verification platform for cataract surgeons, with an AI counselor and biometry report cross-checks."},
     "es": {"title": "Horus Surgical", "description": "Plataforma de educación al paciente y verificación de lentes (IOL) para cirujanos de cataratas, con consejero de IA y control cruzado de biometrías."},
     "it": {"title": "Horus Surgical", "description": "Piattaforma di educazione del paziente e verifica delle IOL per chirurghi della cataratta, con consulente IA e controllo incrociato delle biometrie."}}'::jsonb,
   '', array['React', 'TypeScript', 'Supabase', 'AWS', 'Bedrock', 'Tailwind'],
   'https://app.horussurgical.com', 'fullstack', false, false, false),
  ('UR POV', 'Verified local recommendations',
   'Mobile app to discover verified businesses recommended by real people in South Africa, with reviews, POV posts and in-app messaging.',
   '{"en": {"title": "UR POV", "description": "Mobile app to discover verified businesses recommended by real people in South Africa, with reviews, POV posts and in-app messaging."},
     "es": {"title": "UR POV", "description": "App mobile para descubrir negocios verificados recomendados por personas reales en Sudáfrica, con reseñas, posts POV y mensajería."},
     "it": {"title": "UR POV", "description": "App mobile per scoprire attività verificate consigliate da persone reali in Sudafrica, con recensioni, post POV e messaggi."}}'::jsonb,
   '', array['React Native', 'Expo', 'TypeScript', 'Supabase'],
   null, 'mobile', false, false, false);

insert into personal.project_showcase (project_id, position, highlighted)
select p.id, s.position, s.highlighted
from (values
  ('Investamind', 1, true),
  ('Festival PRO', 2, true),
  ('Horus Surgical', 3, true),
  ('Anchor', 4, false),
  ('HFlow - Enterprise Payroll Platform', 5, false),
  ('EstudialoAI - AI-Powered Learning Platform', 6, false),
  ('Happiness To Go - Wellness & Habits App', 7, false),
  ('UR POV', 8, false)
) as s (title, position, highlighted)
join public.projects p on p.title = s.title;
