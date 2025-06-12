-- Add test data for a project

-- First, ensure we have a test project
INSERT INTO projects (id, name, description, status, project_type, token_symbol, target_raise, authorized_shares, share_price, created_at, updated_at)
VALUES 
('test-project-1', 'Test Project 1', 'A test project for dashboard metrics', 'active', 'equity', 'TST1', 5000000, 1000000, 5.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a cap table for the project
INSERT INTO cap_tables (id, project_id, name, description, created_at, updated_at)
VALUES 
('test-cap-table-1', 'test-project-1', 'Test Cap Table', 'Cap table for test project', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add test investors
INSERT INTO investors (investor_id, name, email, type, kyc_status, created_at, updated_at)
VALUES 
('test-investor-1', 'John Doe', 'john@example.com', 'individual', 'approved', NOW(), NOW()),
('test-investor-2', 'Jane Smith', 'jane@example.com', 'individual', 'pending', NOW(), NOW()),
('test-investor-3', 'Acme Corp', 'info@acme.com', 'entity', 'approved', NOW(), NOW()),
('test-investor-4', 'Bob Johnson', 'bob@example.com', 'individual', 'not_started', NOW(), NOW()),
('test-investor-5', 'Global Ventures', 'info@globalventures.com', 'entity', 'approved', NOW(), NOW())
ON CONFLICT (investor_id) DO NOTHING;

-- Add investors to cap table
INSERT INTO cap_table_investors (cap_table_id, investor_id, created_at)
VALUES 
('test-cap-table-1', 'test-investor-1', NOW()),
('test-cap-table-1', 'test-investor-2', NOW()),
('test-cap-table-1', 'test-investor-3', NOW()),
('test-cap-table-1', 'test-investor-4', NOW()),
('test-cap-table-1', 'test-investor-5', NOW())
ON CONFLICT (cap_table_id, investor_id) DO NOTHING;

-- Add subscriptions
INSERT INTO subscriptions (id, investor_id, project_id, subscription_id, currency, fiat_amount, subscription_date, confirmed, allocated, distributed, created_at, updated_at)
VALUES 
('test-sub-1', 'test-investor-1', 'test-project-1', 'SUB-001', 'USD', 500000, NOW(), TRUE, TRUE, FALSE, NOW(), NOW()),
('test-sub-2', 'test-investor-2', 'test-project-1', 'SUB-002', 'USD', 250000, NOW(), TRUE, TRUE, FALSE, NOW(), NOW()),
('test-sub-3', 'test-investor-3', 'test-project-1', 'SUB-003', 'USD', 1000000, NOW(), TRUE, TRUE, TRUE, NOW(), NOW()),
('test-sub-4', 'test-investor-4', 'test-project-1', 'SUB-004', 'USD', 100000, NOW(), FALSE, FALSE, FALSE, NOW(), NOW()),
('test-sub-5', 'test-investor-5', 'test-project-1', 'SUB-005', 'USD', 750000, NOW(), TRUE, FALSE, FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add token allocations
INSERT INTO token_allocations (id, subscription_id, token_amount, token_type, distributed, created_at)
VALUES 
('test-alloc-1', 'test-sub-1', 100000, 'equity', FALSE, NOW()),
('test-alloc-2', 'test-sub-2', 50000, 'equity', FALSE, NOW()),
('test-alloc-3', 'test-sub-3', 200000, 'equity', TRUE, NOW()),
('test-alloc-4', 'test-sub-4', 20000, 'equity', FALSE, NOW()),
('test-alloc-5', 'test-sub-5', 150000, 'equity', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;
