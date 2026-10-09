import type {
  ContentItemRow,
  ProductRow,
  ShowcaseRow,
  SiteSettingsRow,
  TestimonialRow,
} from './site-data';

/**
 * Deterministic stand-ins used when Supabase env vars are absent (CI,
 * contributors). Shapes mirror the real rows so the same mappers run.
 */

const project = (
  n: number,
  title: string,
  highlighted: boolean,
  category: string,
  technologies: string[]
): ShowcaseRow => ({
  id: `fixture-project-${n}`,
  title,
  subtitle: `${title} subtitle`,
  description: `${title} is a fixture project used when the content database is unavailable.`,
  translations: {
    es: {
      title,
      description: `${title} es un proyecto de ejemplo usado cuando la base de contenido no está disponible.`,
    },
  },
  showcase_translations: {},
  image: null,
  images: [],
  image_orientation: 'landscape',
  technologies,
  category,
  live_url: `https://example.com/${n}`,
  app_store_url: null,
  play_store_url: null,
  highlighted,
  position: n,
});

export const fixtureShowcase: ShowcaseRow[] = [
  project(1, 'Investamind', true, 'mobile', ['React Native', 'Supabase']),
  project(2, 'Festival PRO', true, 'mobile', ['Expo', 'TypeScript']),
  project(3, 'Horus Surgical', true, 'web', ['React', 'AWS']),
  project(4, 'UR POV', false, 'web', ['Astro', 'TypeScript']),
  project(5, 'Capsule Dashboard', false, 'web', ['Next.js', 'PostgreSQL']),
];

const product = (
  n: number,
  slug: string,
  name: string,
  url: string,
  es: string,
  en: string
): ProductRow => ({
  id: `fixture-product-${n}`,
  slug,
  name,
  translations: {
    es: { tagline: es, description: es },
    en: { tagline: en, description: en },
  },
  status: 'live',
  url,
  logo: null,
  brand_color: null,
  show_on_personal: true,
  show_on_agency: true,
  position: n,
});

export const fixtureProducts: ProductRow[] = [
  product(
    1,
    'stagionaly',
    'Stagionaly',
    'https://www.stagionaly.com',
    'Frutas y verduras de temporada',
    'Seasonal produce guide'
  ),
  product(
    2,
    'elevate',
    'Elevate',
    'https://byelevate.app',
    'Entrenamiento y hábitos',
    'Training and habits'
  ),
  product(
    3,
    'orbys',
    'Orbys',
    'https://www.getorbys.com',
    'Gestión para agencias',
    'Agency operations'
  ),
];

export const fixtureContentItems: ContentItemRow[] = [];

export const fixtureSiteSettings: SiteSettingsRow = {
  id: 1,
  email: null,
  socials: {},
  translations: { es: { bio: 'Arquitecto de software.' }, en: { bio: 'Software architect.' } },
};

export const fixtureTestimonials: TestimonialRow[] = [
  {
    id: 'fixture-review-1',
    text: 'Very efficient in all tasks, always open to new changes.',
    author: 'Ricardo Mejia',
    company: 'HFlow',
    position: 'CEO & Founder',
    translations: {
      en: {
        text: 'Very efficient in all tasks, always open to new changes.',
        position: 'CEO & Founder',
      },
      es: {
        text: 'Muy eficientes en todas las tareas, siempre abiertos a nuevos cambios.',
        position: 'CEO y Fundador',
      },
    },
    rating: 5,
    avatar: '',
    date: '2026-06-18',
  },
  {
    id: 'fixture-review-2',
    text: 'Great communication and well-understood tasks.',
    author: 'Fixture Client',
    company: 'Example Co',
    position: 'Founder',
    translations: {},
    rating: 4,
    avatar: '',
    date: '2026-05-01',
  },
];
