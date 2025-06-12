-- Disable RLS for subscriptions table
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Enable realtime for subscriptions table
alter publication supabase_realtime add table subscriptions;