export interface CatalogSearchParts {
  productTerm: string;
  presentationTerms: string[];
}

// Product terms and presentation terms are combined with AND in the routes.

const PRESENTATION_PATTERN = /^(?:\d+(?:[.,]\d+)?(?:kg|g|gr|lb|ml|l)|\d+x\d+|\d+(?:unidad|unidades))$/i;

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactPresentation(value: string): string {
  return value.replace(
    /(\d+(?:[.,]\d+)?)\s+(kg|g|gr|lb|ml|l|unidad|unidades)\b/gi,
    '$1$2',
  );
}

export function extractPresentationTerms(search: string): CatalogSearchParts {
  const normalized = compactPresentation(normalizeSearch(search));
  const words = normalized.split(/\s+/).filter(Boolean);
  const presentationTerms = words.filter((word) => PRESENTATION_PATTERN.test(word));
  const productTerm = words
    .filter((word) => !PRESENTATION_PATTERN.test(word))
    .join(' ')
    .trim();

  return { productTerm, presentationTerms };
}

function escapePostgrest(value: string): string {
  return value.replace(/[,%()]/g, '').trim();
}

function addSingleAccentForms(value: string, forms: Set<string>): void {
  const accents: Record<string, string> = {
    a: 'á',
    e: 'é',
    i: 'í',
    o: 'ó',
    u: 'ú',
  };

  for (let index = 0; index < value.length; index += 1) {
    const accented = accents[value[index]];
    if (accented) {
      forms.add(`${value.slice(0, index)}${accented}${value.slice(index + 1)}`);
    }
  }
}

export function getSearchForms(value: string): string[] {
  const raw = compactPresentation(value.trim().toLowerCase());
  const normalized = normalizeSearch(raw);
  const forms = new Set<string>([raw, normalized]);
  addSingleAccentForms(normalized, forms);

  // Common catalog spelling that is not recovered by single-accent expansion
  // when the source term is already normalized.
  if (normalized === 'limon') forms.add('limón');

  return Array.from(forms)
    .map(escapePostgrest)
    .filter(Boolean)
    .slice(0, 32);
}

export function buildIlikeConditions(
  columns: string[],
  forms: string[],
): string {
  return forms
    .flatMap((form) =>
      columns.map((column) => `${column}.ilike.%${escapePostgrest(form)}%`),
    )
    .join(',');
}

export function buildVariantProductFilter(productIds: string[]): string | null {
  const safeIds = Array.from(
    new Set(productIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id))),
  );

  return safeIds.length > 0 ? `id.in.(${safeIds.join(',')})` : null;
}
