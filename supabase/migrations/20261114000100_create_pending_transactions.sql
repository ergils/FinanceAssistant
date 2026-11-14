
create table if not exists public.pending_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_hash text not null,
  whatsapp_message_id text not null unique,
  transaction_data jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'expired')),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists pending_transactions_user_status_idx
  on public.pending_transactions (user_id, status);

create index if not exists pending_transactions_expiry_idx
  on public.pending_transactions (expires_at);

alter table public.pending_transactions enable row level security;
