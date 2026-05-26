-- ─── Table disputes ──────────────────────────────────────────────────────────

create type dispute_reason as enum (
  'not_received',
  'not_as_described',
  'damaged',
  'other'
);

create type dispute_status as enum (
  'open',
  'under_review',
  'resolved_buyer',
  'resolved_seller',
  'closed'
);

create table disputes (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid not null references transactions(id) on delete cascade,
  listing_id        uuid not null references listings(id) on delete cascade,
  buyer_id          uuid not null references profiles(id) on delete cascade,
  seller_id         uuid not null references profiles(id) on delete cascade,
  reason            dispute_reason not null,
  description       text not null,
  status            dispute_status not null default 'open',
  refund_amount     integer,   -- centimes, null = remboursement total
  admin_note        text,
  stripe_refund_id  text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  -- Un seul litige par transaction
  constraint disputes_transaction_unique unique (transaction_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table disputes enable row level security;

-- Acheteur et vendeur voient leur litige
create policy "disputes_participant_select"
  on disputes for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Seul l'acheteur peut ouvrir un litige (via edge function avec service role)
-- Les edge functions utilisent le service role, pas besoin de policy insert/update

-- ─── Index ───────────────────────────────────────────────────────────────────

create index disputes_buyer_idx   on disputes (buyer_id);
create index disputes_seller_idx  on disputes (seller_id);
create index disputes_status_idx  on disputes (status);
create index disputes_created_idx on disputes (created_at desc);
