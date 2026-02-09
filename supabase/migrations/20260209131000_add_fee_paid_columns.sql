alter table public.transfers
  add column if not exists fee_paid boolean not null default false,
  add column if not exists fee_paid_at timestamptz null;

comment on column public.transfers.fee_paid is 'Whether the fee has been confirmed as paid';
comment on column public.transfers.fee_paid_at is 'Timestamp when the fee payment was confirmed';
