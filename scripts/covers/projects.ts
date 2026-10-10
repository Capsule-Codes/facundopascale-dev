import type { CoverConfig } from './config.ts';

/** One entry per project cover. Asset paths are relative to scripts/covers/. */
export const covers: CoverConfig[] = [
  {
    slug: 'ur-pov',
    title: 'UR POV',
    tagline: 'Real voices. Real people.\nVerified local recommendations.',
    pill: 'iOS · Android · South Africa',
    gradient: ['#78D5F5', '#3E9BD3', '#1C76B5', '#145C8E'],
    textColor: '#ffffff',
    logo: 'assets/ur-pov/logo.png',
    screenshots: ['assets/ur-pov/screenshot.png'],
    frame: 'phone',
  },
  {
    slug: 'elevate',
    title: 'Elevate',
    tagline: 'One coaching suite.\nTrainers, nutritionists and gyms.',
    pill: 'COACH · NUTRI · GYM',
    gradient: ['#397FED', '#1D4DB0', '#0F235A', '#091640'],
    textColor: '#ffffff',
    logo: 'assets/elevate/logo.png',
    screenshots: ['assets/elevate/screenshot-1.png', 'assets/elevate/screenshot-2.png'],
    frame: 'phone',
  },
];
