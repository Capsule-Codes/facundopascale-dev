/**
 * Product editing for `/admin/products`. `public.products` is shared with the
 * agency site, so only the personal-site fields are ever written: status, url,
 * show_on_personal, position and the tagline/description translations. Slug,
 * name, logo, brand colour and show_on_agency are never sent. Writes run
 * through the signed-in user's client, so RLS stays the real authority.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  POSITION_ERROR,
  check,
  formText,
  isHttpUrl,
  lengthError,
  mergeTranslations,
  parsePosition,
  translationField,
  type Locale,
} from './admin-form';

export const PRODUCT_STATUSES = ['idea', 'beta', 'live', 'sunset'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const TAGLINE_MAX = 200;
export const DESCRIPTION_MAX = 2000;

export type ProductSummary = {
  slug: string;
  name: string;
  status: ProductStatus;
  show_on_personal: boolean;
  position: number;
};

export type Product = ProductSummary & {
  id: string;
  url: string | null;
  translations: Partial<Record<string, Partial<Record<string, string>>>> | null;
};

type LocaleFields = { tagline: string; description: string };

export type ProductInput = {
  status: ProductStatus;
  url: string | null;
  show_on_personal: boolean;
  position: number;
  translations: Record<Locale, LocaleFields>;
};

/** Raw submitted strings, used to re-render the form after a validation error. */
export type ProductFormValues = {
  status: string;
  url: string;
  show_on_personal: boolean;
  position: string;
  tagline_es: string;
  tagline_en: string;
  description_es: string;
  description_en: string;
};

export type ProductParseResult =
  | { ok: true; value: ProductInput }
  | {
      ok: false;
      errors: Partial<Record<keyof ProductFormValues, string>>;
      values: ProductFormValues;
    };

const isStatus = (value: string): value is ProductStatus =>
  (PRODUCT_STATUSES as readonly string[]).includes(value);

export function toProductFormValues(product: Product): ProductFormValues {
  return {
    status: product.status,
    url: product.url ?? '',
    show_on_personal: product.show_on_personal,
    position: String(product.position),
    tagline_es: translationField(product.translations, 'es', 'tagline'),
    tagline_en: translationField(product.translations, 'en', 'tagline'),
    description_es: translationField(product.translations, 'es', 'description'),
    description_en: translationField(product.translations, 'en', 'description'),
  };
}

export function parseProductForm(form: FormData): ProductParseResult {
  const values: ProductFormValues = {
    status: formText(form, 'status'),
    url: formText(form, 'url').trim(),
    show_on_personal: form.get('show_on_personal') !== null,
    position: formText(form, 'position').trim(),
    tagline_es: formText(form, 'tagline_es').trim(),
    tagline_en: formText(form, 'tagline_en').trim(),
    description_es: formText(form, 'description_es').trim(),
    description_en: formText(form, 'description_en').trim(),
  };
  const errors: Partial<Record<keyof ProductFormValues, string>> = {};

  if (!isStatus(values.status)) errors.status = 'Choose a status.';
  if (values.url && !isHttpUrl(values.url)) errors.url = 'Enter a full http(s) URL.';
  const position = parsePosition(values.position);
  if (position === null) errors.position = POSITION_ERROR;
  for (const [field, label] of [
    ['tagline_es', 'Spanish tagline'],
    ['tagline_en', 'English tagline'],
  ] as const) {
    if (values[field].length > TAGLINE_MAX) errors[field] = lengthError(label, TAGLINE_MAX);
  }
  for (const [field, label] of [
    ['description_es', 'Spanish description'],
    ['description_en', 'English description'],
  ] as const) {
    if (values[field].length > DESCRIPTION_MAX) {
      errors[field] = lengthError(label, DESCRIPTION_MAX);
    }
  }

  if (Object.keys(errors).length > 0 || position === null || !isStatus(values.status)) {
    return { ok: false, errors, values };
  }

  return {
    ok: true,
    value: {
      status: values.status,
      url: values.url || null,
      show_on_personal: values.show_on_personal,
      position,
      translations: {
        es: { tagline: values.tagline_es, description: values.description_es },
        en: { tagline: values.tagline_en, description: values.description_en },
      },
    },
  };
}

type Client = Pick<SupabaseClient, 'schema'>;

const products = (client: Client) => client.schema('public').from('products');

export async function listProducts(client: Client): Promise<ProductSummary[]> {
  const { data } = check(
    await products(client)
      .select('slug, name, status, show_on_personal, position')
      .order('position', { ascending: true }),
    'Could not load products'
  );
  return (data ?? []) as ProductSummary[];
}

export async function getProduct(client: Client, slug: string): Promise<Product | null> {
  const { data } = check(
    await products(client)
      .select('id, slug, name, status, url, show_on_personal, position, translations')
      .eq('slug', slug)
      .maybeSingle(),
    'Could not load the product'
  );
  return (data as Product | null) ?? null;
}

/**
 * Writes only the personal-site fields; translations are merged into the stored
 * ones so unknown locales and keys survive. Returns false when no row matched.
 */
export async function updateProduct(
  client: Client,
  slug: string,
  input: ProductInput
): Promise<boolean> {
  const current = await getProduct(client, slug);
  if (!current) return false;

  const { data } = check(
    await products(client)
      .update({
        status: input.status,
        url: input.url,
        show_on_personal: input.show_on_personal,
        position: input.position,
        translations: mergeTranslations(current.translations, input.translations),
      })
      .eq('slug', slug)
      .select('slug')
      .maybeSingle(),
    'Could not update the product'
  );
  return data !== null && data !== undefined;
}
