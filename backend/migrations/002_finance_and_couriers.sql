-- TonMenu centralised collection, immutable accounting ledger and courier operations.
-- Apply after schema.sql; run with a database-owner role in a controlled migration.
BEGIN;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN (
  'pending_verification','paid','cash_due','not_received','awaiting_payment','reported','confirmed','rejected','expired','cash_collected','refunded'
));
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'new','preparing','ready','delivery','done','cancelled','payment_pending','payment_review','pending_restaurant','accepted','delivering','delivered','refunded','disputed'
));

CREATE TABLE IF NOT EXISTS platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  merchant_numbers jsonb NOT NULL DEFAULT '{}'::jsonb,
  commission_bps integer NOT NULL DEFAULT 1000 CHECK (commission_bps BETWEEN 0 AND 5000),
  service_fee integer NOT NULL DEFAULT 250 CHECK (service_fee >= 0),
  courier_platform_fee integer NOT NULL DEFAULT 200 CHECK (courier_platform_fee >= 0),
  min_payout integer NOT NULL DEFAULT 5000 CHECK (min_payout >= 0),
  payout_day smallint NOT NULL DEFAULT 1 CHECK (payout_day BETWEEN 1 AND 7),
  payout_delay_hours smallint NOT NULL DEFAULT 48 CHECK (payout_delay_hours BETWEEN 1 AND 168),
  cod_max integer NOT NULL DEFAULT 30000 CHECK (cod_max >= 0),
  cash_settlement_rule text NOT NULL DEFAULT 'offset' CHECK (cash_settlement_rule IN ('offset','remit')),
  cod_zones text[] NOT NULL DEFAULT ARRAY['Yopougon','Abobo','Cocody','Marcory','Treichville'],
  payment_confirm_minutes smallint NOT NULL DEFAULT 10,
  payment_expire_minutes smallint NOT NULL DEFAULT 30,
  dual_approval_threshold integer NOT NULL DEFAULT 100000,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO platform_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS client_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  operator text NOT NULL CHECK (operator IN ('orange_money','mtn_momo','moov_money','cash_on_delivery')),
  amount integer NOT NULL CHECK (amount > 0),
  reference text,
  proof_storage_key text,
  status text NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','reported','confirmed','rejected','expired','refund_pending','refunded','cash_due','cash_collected')),
  reported_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  refunded_amount integer NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (operator='cash_on_delivery' OR (reference IS NULL OR length(trim(reference)) BETWEEN 5 AND 80))
);
CREATE UNIQUE INDEX IF NOT EXISTS client_payments_reference_unique ON client_payments (lower(reference)) WHERE reference IS NOT NULL AND status <> 'rejected';
CREATE INDEX IF NOT EXISTS client_payments_review_queue_idx ON client_payments (status,created_at) WHERE status='reported';

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_type text NOT NULL CHECK (beneficiary_type IN ('restaurant','courier','tonmenu')),
  beneficiary_id text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('restaurant_sale','courier_earning','platform_revenue','cash_due_to_tonmenu','cash_remitted','refund','adjustment','payout','dispute_hold','reversal')),
  amount integer NOT NULL CHECK (amount <> 0),
  order_id uuid REFERENCES orders(id),
  payout_id uuid,
  reverses_entry_id uuid REFERENCES ledger_entries(id),
  memo text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ledger_beneficiary_created_idx ON ledger_entries (beneficiary_type,beneficiary_id,created_at DESC);
CREATE INDEX IF NOT EXISTS ledger_order_idx ON ledger_entries(order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ledger_order_credit_once_idx ON ledger_entries (order_id,beneficiary_type,entry_type) WHERE order_id IS NOT NULL AND entry_type IN ('restaurant_sale','courier_earning');

CREATE OR REPLACE FUNCTION tonmenu_ledger_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ledger_entries are immutable; append a reversal entry instead'; END; $$;
DROP TRIGGER IF EXISTS ledger_entries_no_update_delete ON ledger_entries;
CREATE TRIGGER ledger_entries_no_update_delete BEFORE UPDATE OR DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION tonmenu_ledger_immutable();

CREATE OR REPLACE VIEW wallet_balances AS
SELECT beneficiary_type,beneficiary_id,COALESCE(sum(amount),0)::bigint AS balance_fcfa,
       max(created_at) AS last_entry_at
FROM ledger_entries GROUP BY beneficiary_type,beneficiary_id;

CREATE TABLE IF NOT EXISTS payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','in_progress','paid','blocked','deferred')),
  total_net bigint NOT NULL DEFAULT 0,
  created_by uuid,
  approved_by uuid,
  second_approved_by uuid,
  paid_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES payout_batches(id),
  beneficiary_type text NOT NULL CHECK (beneficiary_type IN ('restaurant','courier')),
  beneficiary_id text NOT NULL,
  gross_amount integer NOT NULL DEFAULT 0,
  deductions integer NOT NULL DEFAULT 0,
  adjustments integer NOT NULL DEFAULT 0,
  net_amount integer NOT NULL CHECK (net_amount >= 0),
  order_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'to_pay' CHECK (status IN ('to_pay','in_progress','paid','blocked','deferred','carried')),
  reference text,
  blocked_reason text,
  transfer_method text NOT NULL DEFAULT 'mobile_money' CHECK (transfer_method IN ('mobile_money','bank_transfer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  paid_by uuid,
  UNIQUE (batch_id,beneficiary_type,beneficiary_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS payout_transfer_reference_unique ON payouts(lower(reference)) WHERE reference IS NOT NULL;
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_payout_id_fkey;
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_payout_id_fkey FOREIGN KEY (payout_id) REFERENCES payouts(id);
CREATE TABLE IF NOT EXISTS payout_lines (
  payout_id uuid NOT NULL REFERENCES payouts(id),
  ledger_entry_id uuid NOT NULL REFERENCES ledger_entries(id),
  PRIMARY KEY (payout_id,ledger_entry_id),
  UNIQUE (ledger_entry_id)
);

CREATE TABLE IF NOT EXISTS couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  commune text NOT NULL,
  zone text NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('motorcycle','bicycle','car','walking')),
  plate_number text,
  emergency_phone text,
  payout_method text NOT NULL CHECK (payout_method IN ('orange_money','mtn_momo','moov_money','bank_transfer')),
  payout_account text NOT NULL,
  payout_account_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','active','suspended','rejected')),
  availability boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  completed_deliveries integer NOT NULL DEFAULT 0,
  terms_accepted_at timestamptz NOT NULL,
  training_completed_at timestamptz,
  status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS courier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES couriers(id),
  document_type text NOT NULL CHECK (document_type IN ('profile_photo','identity_front','identity_back','vehicle_photo','driving_permit')),
  storage_key text NOT NULL,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','verified','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS courier_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  courier_id uuid REFERENCES couriers(id),
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered','accepted','at_restaurant','picked_up','en_route','delivered','declined','cancelled')),
  offered_at timestamptz,
  accepted_at timestamptz,
  arrived_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  handoff_code_hash text,
  driver_earning integer NOT NULL DEFAULT 0,
  location_lat double precision,
  location_lng double precision,
  location_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cash_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  courier_id uuid NOT NULL REFERENCES couriers(id),
  expected_amount integer NOT NULL CHECK (expected_amount >= 0),
  declared_amount integer NOT NULL CHECK (declared_amount >= 0),
  remitted_amount integer NOT NULL DEFAULT 0 CHECK (remitted_amount >= 0),
  remit_amount integer NOT NULL DEFAULT 0 CHECK (remit_amount >= 0),
  settlement_rule text NOT NULL DEFAULT 'offset' CHECK (settlement_rule IN ('offset','remit')),
  status text NOT NULL DEFAULT 'declared' CHECK (status IN ('declared','variance','offset_due','remittance_due','partial','offset','remitted','disputed')),
  declared_at timestamptz NOT NULL DEFAULT now(),
  reconciled_by uuid,
  reconciled_at timestamptz,
  note text
);
CREATE TABLE IF NOT EXISTS order_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  opened_by text NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','rejected')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS open_disputes_order_idx ON order_disputes(order_id) WHERE status='open';
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
