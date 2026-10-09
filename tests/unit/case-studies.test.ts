import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  findCaseStudy,
  unmatchedCaseStudies,
  type CaseStudyRef,
} from '../../src/lib/case-studies';

const studies: CaseStudyRef[] = [
  { slug: 'estudialo-ai', title: 'Estudialo AI' },
  { slug: 'festivalpro', title: 'Festival Pro' },
  { slug: 'fitcoach', title: 'FitCoach' },
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
    expect(left.map((s) => s.slug)).toEqual(['fitcoach']);
  });

  it('returns all studies when there are no projects', () => {
    expect(unmatchedCaseStudies([], studies)).toHaveLength(3);
  });
});
