import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  findCaseStudy,
  unmatchedCaseStudies,
  studyAsShowcase,
  type CaseStudyRef,
} from '../../src/lib/case-studies';

const studies: CaseStudyRef[] = [
  { slug: 'estudialo-ai', title: 'Estudialo AI' },
  { slug: 'festivalpro', title: 'Festival Pro' },
  { slug: 'elevate', title: 'Elevate' },
];

describe('normalizeTitle', () => {
  it('lowercases and strips non-alphanumerics', () => {
    expect(normalizeTitle('Festival PRO')).toBe('festivalpro');
    expect(normalizeTitle(' Estudialo-AI! ')).toBe('estudialoai');
  });
});

describe('findCaseStudy', () => {
  it('matches ignoring case and spacing', () => {
    expect(findCaseStudy('Festival PRO', studies)?.slug).toBe('festivalpro');
  });

  it('matches when the project title extends the case study title', () => {
    expect(findCaseStudy('EstudialoAI - AI-Powered Learning Platform', studies)?.slug).toBe(
      'estudialo-ai'
    );
  });

  it('matches when the case study title extends the project title', () => {
    expect(findCaseStudy('Festival', studies)?.slug).toBe('festivalpro');
  });

  it('returns undefined when nothing matches', () => {
    expect(findCaseStudy('Horus Surgical', studies)).toBeUndefined();
  });

  it('never matches on empty or too-short titles', () => {
    expect(findCaseStudy('', studies)).toBeUndefined();
    expect(findCaseStudy('F', studies)).toBeUndefined();
  });
});

describe('unmatchedCaseStudies', () => {
  it('returns the case studies no project points to', () => {
    const left = unmatchedCaseStudies(
      ['Festival PRO', 'EstudialoAI - Learning', 'UR POV'],
      studies
    );
    expect(left.map((s) => s.slug)).toEqual(['elevate']);
  });

  it('returns all studies when there are no projects', () => {
    expect(unmatchedCaseStudies([], studies)).toHaveLength(3);
  });
});

describe('Elevate case study', () => {
  const elevate: CaseStudyRef[] = [{ slug: 'elevate', title: 'Elevate' }];

  it.each(['Elevate', 'Elevate Coach', 'Elevate - Coaching Suite'])('matches "%s"', (title) => {
    expect(findCaseStudy(title, elevate)?.slug).toBe('elevate');
  });

  it('does not match unrelated titles', () => {
    expect(findCaseStudy('Elena', elevate)).toBeUndefined();
  });
});

describe('studyAsShowcase', () => {
  it('maps an internal case study onto a showcase card with its cover', () => {
    expect(
      studyAsShowcase({
        slug: 'elevate',
        title: 'Elevate',
        tagline: 'Offline-first coaching suite',
        stack: ['Expo', 'Tauri v2'],
        coverImage: '/images/work/elevate/cover.webp',
        live: 'https://byelevate.app',
      })
    ).toEqual({
      id: 'elevate',
      title: 'Elevate',
      subtitle: '',
      summary: 'Offline-first coaching suite',
      description: 'Offline-first coaching suite',
      image: '/images/work/elevate/cover.webp',
      imageOrientation: null,
      gallery: [],
      technologies: ['Expo', 'Tauri v2'],
      category: null,
      links: { live: 'https://byelevate.app' },
      highlighted: false,
      position: 0,
    });
  });

  it('omits the website link when the study has none', () => {
    const card = studyAsShowcase({
      slug: 'orbys',
      title: 'Orbys',
      tagline: 'Agency suite',
      stack: [],
      coverImage: '/images/work/orbys/cover.webp',
    });
    expect(card.links).toEqual({});
  });
});
