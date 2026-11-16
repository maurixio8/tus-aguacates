const BOGOTA_OFFSET = '-05:00';

export type BuyerPurchaseCycle = {
  deliveryDate: string;
  startsAt: Date;
  endsAt: Date;
  handoffAt: Date;
};

function bogotaParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
    hour: Number(parts.find((part) => part.type === 'hour')?.value),
    weekday: new Date(Date.UTC(
      Number(parts.find((part) => part.type === 'year')?.value),
      Number(parts.find((part) => part.type === 'month')?.value) - 1,
      Number(parts.find((part) => part.type === 'day')?.value),
    )).getUTCDay(),
  };
}

function dateString(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  return dateString(year, month, day + days);
}

function atBogota(date: string, hour: number) {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00${BOGOTA_OFFSET}`);
}

export function buyerPurchaseCycle(now = new Date()): BuyerPurchaseCycle {
  const parts = bogotaParts(now);
  const today = dateString(parts.year, parts.month, parts.day);
  let deliveryDate: string;

  // The Tuesday screen remains active while Nicolás is working. The visible
  // handoff to Friday happens Tuesday at 18:00 COT, not Tuesday at 06:00.
  if (parts.weekday === 2 && parts.hour < 18) deliveryDate = today;
  else if ((parts.weekday === 2 && parts.hour >= 18) || parts.weekday === 3 || parts.weekday === 4 || (parts.weekday === 5 && parts.hour < 6)) deliveryDate = addDays(today, 5 - parts.weekday);
  else if (parts.weekday === 5) deliveryDate = addDays(today, 4);
  else deliveryDate = addDays(today, (2 - parts.weekday + 7) % 7 || 7);

  return buyerPurchaseCycleForDeliveryDate(deliveryDate);
}

export function buyerPurchaseCycleForDeliveryDate(deliveryDate: string): BuyerPurchaseCycle {
  const [year, month, day] = deliveryDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const daysBefore = weekday === 2 ? 4 : 3;
  const startsDate = addDays(deliveryDate, -daysBefore);
  const startsAt = atBogota(startsDate, 6);
  const endsAt = atBogota(deliveryDate, 6);
  const handoffAt = weekday === 5 ? atBogota(startsDate, 18) : atBogota(startsDate, 18);
  return { deliveryDate, startsAt, endsAt, handoffAt };
}

export function formatBuyerDeliveryDate(date: string, locale = 'es-CO') {
  return new Intl.DateTimeFormat(locale, { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00${BOGOTA_OFFSET}`));
}
