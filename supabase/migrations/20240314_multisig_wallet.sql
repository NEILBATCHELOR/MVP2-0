-- Multi-sig wallet tables

-- Wallets table
create table if not exists wallets (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  blockchain text not null,
  address text not null,
  signers text[] not null,
  threshold integer not null,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(blockchain, address)
);

-- Proposals table
create table if not exists proposals (
  id uuid default uuid_generate_v4() primary key,
  wallet_id uuid references wallets(id) not null,
  to_address text not null,
  amount text not null,
  token text not null default 'native',
  data text default '',
  status text not null default 'pending',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  executed_at timestamp with time zone
);

-- Signatures table
create table if not exists signatures (
  id uuid default uuid_generate_v4() primary key,
  proposal_id uuid references proposals(id) not null,
  signer_address text not null,
  signature text not null,
  created_at timestamp with time zone default now() not null,
  unique(proposal_id, signer_address)
);

-- RLS Policies
alter table wallets enable row level security;
alter table proposals enable row level security;
alter table signatures enable row level security;

-- Wallets policies
create policy "Users can view their own wallets or wallets they sign"
on wallets for select
using (auth.uid() = owner_id or auth.uid()::text = any(signers));

create policy "Users can insert their own wallets"
on wallets for insert
with check (auth.uid() = owner_id);

create policy "Users can update their own wallets"
on wallets for update
using (auth.uid() = owner_id);

create policy "Users can delete their own wallets"
on wallets for delete
using (auth.uid() = owner_id);

-- Proposals policies
create policy "Users can view proposals for their wallets"
on proposals for select
using (wallet_id in (select id from wallets where auth.uid() = owner_id or auth.uid()::text = any(signers)));

create policy "Users can insert proposals for their wallets"
on proposals for insert
with check (wallet_id in (select id from wallets where auth.uid() = owner_id or auth.uid()::text = any(signers)));

create policy "Users can update proposals for their wallets"
on proposals for update
using (wallet_id in (select id from wallets where auth.uid() = owner_id or auth.uid()::text = any(signers)));

-- Signatures policies
create policy "Users can view signatures"
on signatures for select
using (proposal_id in (select id from proposals where wallet_id in 
  (select id from wallets where auth.uid() = owner_id or auth.uid()::text = any(signers))));

create policy "Users can insert signatures for proposals they can sign"
on signatures for insert
with check (proposal_id in (select id from proposals where wallet_id in 
  (select id from wallets where auth.uid()::text = any(signers)))); 