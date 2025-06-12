-- Create distributions table to track confirmed token distributions
create table public.distributions (
  id uuid not null default extensions.uuid_generate_v4(),
  token_allocation_id uuid not null,
  investor_id uuid not null,
  subscription_id uuid not null,
  project_id uuid null,
  token_type text not null,
  token_amount numeric not null,
  distribution_date timestamp with time zone not null,
  distribution_tx_hash text not null,
  wallet_id uuid null,
  blockchain text not null,
  token_address text null,
  token_symbol text null,
  to_address text not null, -- investor wallet address
  status text not null default 'confirmed'::text,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint distributions_pkey primary key (id),
  constraint distributions_token_allocation_fkey foreign key (token_allocation_id) references token_allocations (id) on delete cascade,
  constraint distributions_investor_fkey foreign key (investor_id) references investors (investor_id) on delete cascade,
  constraint distributions_subscription_fkey foreign key (subscription_id) references subscriptions (id) on delete cascade,
  constraint distributions_project_fkey foreign key (project_id) references projects (id) on delete set null,
  constraint distributions_wallet_fkey foreign key (wallet_id) references multi_sig_wallets (id) on delete set null,
  constraint distributions_token_amount_check check ((token_amount > (0)::numeric))
) tablespace pg_default;

comment on table public.distributions is 'Records of confirmed token distributions with blockchain transaction data';

-- Create trigger for logging changes
create trigger log_distribution_changes
after insert or delete or update on distributions
for each row execute function log_user_action();

-- Create index for common queries
create index idx_distributions_investor_id on distributions(investor_id);
create index idx_distributions_token_allocation_id on distributions(token_allocation_id);
create index idx_distributions_distribution_date on distributions(distribution_date); 