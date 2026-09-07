alter table public.profiles
  add column stripe_customer_id     text unique,
  add column stripe_subscription_id text,
  add column subscription_status    text,
  add column current_period_end     timestamptz;

create index profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
