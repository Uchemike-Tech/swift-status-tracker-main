-- Add fee fields to transfers
alter table public.transfers
  add column if not exists fee_amount numeric null,
  add column if not exists fee_btc_address text null;

comment on column public.transfers.fee_amount is 'Optional fee charge amount for the transfer';
comment on column public.transfers.fee_btc_address is 'BTC address where the fee should be sent';
