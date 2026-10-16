import type { ShowcaseProject } from './site-data';

export type CardCover = { src: string; alt: string };

/**
 * Thumbnail for a project card: the project's cover image (`projects.image`),
 * falling back to the first gallery screenshot only when no cover is set.
 */
export function cardCover(
  project: Pick<ShowcaseProject, 'title' | 'image' | 'gallery'>
): CardCover | null {
  if (project.image) return { src: project.image, alt: project.title };
  const first = project.gallery[0];
  return first ? { src: first.src, alt: first.alt || project.title } : null;
}
