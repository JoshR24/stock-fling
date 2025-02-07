
-- Create stocks table
create table if not exists public.stocks (
  id serial primary key,
  symbol text not null unique,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create stock_data_cache table
create table if not exists public.stock_data_cache (
  id serial primary key,
  symbol text not null unique references stocks(symbol),
  data jsonb not null,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable row level security
alter table public.stocks enable row level security;
alter table public.stock_data_cache enable row level security;

-- Create policies
create policy "Allow public read access to stocks"
  on public.stocks for select
  to authenticated
  using (true);

create policy "Allow public read access to stock_data_cache"
  on public.stock_data_cache for select
  to authenticated
  using (true);

-- Add realtime replication
alter publication supabase_realtime add table stock_data_cache;
alter table public.stock_data_cache replica identity full;
