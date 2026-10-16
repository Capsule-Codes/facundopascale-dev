import type { ShowcaseProject } from './site-data';

export type CaseStudyRef = { slug: string; title: string };

const MIN_LENGTH = 3;

export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function titlesMatch(a: string, b: string): boolean {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  if (x.length < MIN_LENGTH || y.length < MIN_LENGTH) return false;
  return x.startsWith(y) || y.startsWith(x);
}

/** First case study whose title prefix-matches the project title (normalized). */
export function findCaseStudy<T extends CaseStudyRef>(
  projectTitle: string,
  studies: T[]
): T | undefined {
  return studies.find((s) => titlesMatch(projectTitle, s.title));
}

/** Case studies that no project title points to. */
export function unmatchedCaseStudies(
  projectTitles: string[],
  studies: CaseStudyRef[]
): CaseStudyRef[] {
  return studies.filter((s) => !projectTitles.some((t) => titlesMatch(t, s.title)));
}

export type InternalStudy = {
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
  coverImage: string;
  live?: string | undefined;
};

/** Present an internal case study (no showcase row) with the same card as client projects. */
export function studyAsShowcase(study: InternalStudy): ShowcaseProject {
  return {
    id: study.slug,
    title: study.title,
    subtitle: '',
    summary: study.tagline,
    description: study.tagline,
    image: study.coverImage,
    imageOrientation: null,
    gallery: [],
    technologies: study.stack,
    category: null,
    links: study.live ? { live: study.live } : {},
    highlighted: false,
    position: 0,
  };
}
