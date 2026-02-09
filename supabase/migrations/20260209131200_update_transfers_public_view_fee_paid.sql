
create or replace view public.transfers_public as
select
  t.public_id,
  t.sender_name,
  t.recipient_name,
  t.amount,
  t.currency,
  t.method,
  t.status,
  t.bank_name,
  t.bank_country,
  t.network,
  t.crypto_type,
  t.updated_at,
  t.created_at,
  t.fee_amount,
  t.fee_btc_address,
  t.wallet_address,
  t.fee_paid,
  t.fee_paid_at,
  case
    when t.account_number is null then null
    else '****' || right(t.account_number, 4)
  end as account_number_masked
from public.transfers t;
