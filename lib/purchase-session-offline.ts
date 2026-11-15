export interface PromoGiftConfig {
  enabled: boolean;
  triggerProductName: string;
  triggerVariantName?: string;
  triggerVariantValue?: string;
  giftProductName: 'Duraznos';
  giftSupplierId: 'popular';
  giftSubLocation: '📍 Mayorista';
  giftQtyPerTrigger: number;
  giftPackageLabel: 'Paquete de 5-6 Duraznos';
}

export const DEFAULT_PROMO_GIFT_CONFIG: PromoGiftConfig = {
  enabled: true,
  triggerProductName: 'Caja de 24',
  triggerVariantName: 'Caja de 24',
  giftProductName: 'Duraznos',
  giftSupplierId: 'popular',
  giftSubLocation: '📍 Mayorista',
  giftQtyPerTrigger: 1,
  giftPackageLabel: 'Paquete de 5-6 Duraznos',
};

export interface PromoGiftLine {
  name: 'Duraznos';
  quantity: number;
  unit: 'paquete';
  supplierId: 'popular';
  subLocation: '📍 Mayorista';
  isGift: true;
}

export interface CustomerPickingCardLine {
  customerName: string;
  orderId: string;
  text: '🎁 OBSEQUIO PROMO: Paquete de 5-6 Duraznos gratis';
  quantity: number;
}

export interface SessionLine {
  name: string;
  quantity: number;
  unit: string;
  variant?: string;
  customerName?: string;
  orderId?: string;
  isGift?: boolean;
}

export function isCajaDe24Trigger(line: Pick<SessionLine, 'name' | 'variant'>): boolean {
  const haystack = `${line.name} ${line.variant || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\bcaja\s*de\s*24\b/.test(haystack);
}

export function addPromoGifts(
  lines: SessionLine[],
  config: PromoGiftConfig = DEFAULT_PROMO_GIFT_CONFIG,
): { lines: SessionLine[]; gifts: PromoGiftLine[]; pickingCards: CustomerPickingCardLine[] } {
  if (!config.enabled) return { lines: [...lines], gifts: [], pickingCards: [] };
  const triggerLines = lines.filter(isCajaDe24Trigger);
  const triggerQuantity = triggerLines.reduce((sum, line) => sum + Math.max(0, line.quantity), 0);
  if (!triggerQuantity) return { lines: [...lines], gifts: [], pickingCards: [] };
  const giftQuantity = triggerQuantity * config.giftQtyPerTrigger;
  const gift: PromoGiftLine = {
    name: config.giftProductName,
    quantity: giftQuantity,
    unit: 'paquete',
    supplierId: config.giftSupplierId,
    subLocation: config.giftSubLocation,
    isGift: true,
  };
  const cards = triggerLines
    .filter((line): line is SessionLine & { customerName: string; orderId: string } => Boolean(line.customerName && line.orderId))
    .map(line => ({
      customerName: line.customerName,
      orderId: line.orderId,
      text: '🎁 OBSEQUIO PROMO: Paquete de 5-6 Duraznos gratis' as const,
      quantity: Math.max(0, line.quantity) * config.giftQtyPerTrigger,
    }));
  return { lines: [...lines, { ...gift }], gifts: [gift], pickingCards: cards };
}

export interface MutationQueueRecord<T = unknown> {
  mutation_id: string;
  kind: string;
  payload: T;
  created_at: string;
}

export function enqueueMutation<T>(queue: MutationQueueRecord<T>[], record: MutationQueueRecord<T>): MutationQueueRecord<T>[] {
  return queue.some(item => item.mutation_id === record.mutation_id) ? [...queue] : [...queue, record];
}

export function dedupeMutationQueue<T>(queue: MutationQueueRecord<T>[]): MutationQueueRecord<T>[] {
  const seen = new Set<string>();
  return queue.filter(item => !seen.has(item.mutation_id) && seen.add(item.mutation_id));
}

export interface MissingItemLine { customerName: string; orderId: string; productName: string; requestedQuantity: number; purchasedQuantity: number; missingQuantity: number; }
export function getMissingItems(lines: MissingItemLine[]): MissingItemLine[] {
  return lines.map(line => ({ ...line, missingQuantity: Math.max(0, line.requestedQuantity - line.purchasedQuantity) })).filter(line => line.missingQuantity > 0);
}

export function closeJornada(lines: MissingItemLine[]): { status: 'closed' | 'blocked'; missing: MissingItemLine[] } {
  const missing = getMissingItems(lines);
  return { status: missing.length ? 'blocked' : 'closed', missing };
}

const DB_NAME = 'purchase-session-offline';
const DB_VERSION = 1;

export async function requestPersistentStorage(): Promise<boolean> {
  try { return Boolean(await navigator.storage?.persist?.()); } catch { return false; }
}

export function openPurchaseSessionDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('mutation_queue')) db.createObjectStore('mutation_queue', { keyPath: 'mutation_id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

export async function saveDraftToIndexedDb<T extends { id: string }>(draft: T): Promise<void> {
  const db = await openPurchaseSessionDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction('drafts', 'readwrite').objectStore('drafts').put(draft);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Draft persistence failed'));
  });
}

export async function enqueueMutationRecord<T>(record: MutationQueueRecord<T>): Promise<void> {
  const db = await openPurchaseSessionDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction('mutation_queue', 'readwrite').objectStore('mutation_queue').add(record);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      // IndexedDB key collision is the idempotent replay path.
      if (request.error?.name === 'ConstraintError') resolve();
      else reject(request.error || new Error('Mutation queue persistence failed'));
    };
  });
}

export async function listQueuedMutations<T>(): Promise<MutationQueueRecord<T>[]> {
  const db = await openPurchaseSessionDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction('mutation_queue', 'readonly').objectStore('mutation_queue').getAll();
    request.onsuccess = () => resolve(dedupeMutationQueue(request.result as MutationQueueRecord<T>[]));
    request.onerror = () => reject(request.error || new Error('Mutation queue read failed'));
  });
}

export async function backupToClipboard(value: unknown): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
}

export async function restoreFromClipboard<T>(): Promise<T> {
  return JSON.parse(await navigator.clipboard.readText()) as T;
}
