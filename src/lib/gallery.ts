export type GalleryKind = 'phone' | 'desktop';

/** Shape of a `gallery` entry in the work collection frontmatter. */
export interface GalleryEntry {
  src: string;
  alt: string;
  caption?: string | undefined;
  kind?: GalleryKind | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption: string | undefined;
  kind: GalleryKind;
  width: number;
  height: number;
}

/** Intrinsic ratios used to reserve space (avoids layout shift) when none is given. */
export const GALLERY_DIMENSIONS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
} as const satisfies Record<GalleryKind, { width: number; height: number }>;

export function resolveGalleryItem(item: GalleryEntry): GalleryImage {
  const kind = item.kind ?? 'desktop';
  const fallback = GALLERY_DIMENSIONS[kind];
  return {
    src: item.src,
    alt: item.alt,
    caption: item.caption,
    kind,
    width: item.width ?? fallback.width,
    height: item.height ?? fallback.height,
  };
}
