-- Bold payment webhook audit and idempotency ledger.
-- Applies only to the canonical Vercel Bold receiver.
CREATE TABLE IF NOT EXISTS public.bold_payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  transaction_id TEXT,
  event_type TEXT NOT NULL,
  order_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_timestamp TIMESTAMPTZ,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status TEXT NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL,
  guest_rows_updated INTEGER NOT NULL DEFAULT 0,
  order_rows_updated INTEGER NOT NULL DEFAULT 0,
  matched_tables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  error_message TEXT,
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS bold_payment_events_event_id_uidx
  ON public.bold_payment_events (event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bold_payment_events_transaction_id_uidx
  ON public.bold_payment_events (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bold_payment_events_received_at_idx
  ON public.bold_payment_events (received_at DESC);

CREATE INDEX IF NOT EXISTS bold_payment_events_order_id_idx
  ON public.bold_payment_events (order_id);

COMMENT ON TABLE public.bold_payment_events IS
  'Auditoría e idempotencia de eventos recibidos desde Bold por el webhook canónico de Vercel.';

ALTER TABLE public.bold_payment_events ENABLE ROW LEVEL SECURITY;
