-- Create a proper UUID for the test project
DO $$
DECLARE
  test_project_id UUID := gen_random_uuid();
  test_cap_table_id UUID := gen_random_uuid();
BEGIN
  -- Create a test project if it doesn't exist
  INSERT INTO projects (id, name, description, status, project_type, token_symbol, target_raise, authorized_shares, share_price, created_at, updated_at)
  VALUES (test_project_id, 'Test Project', 'Project dashboard test project', 'active', 'equity', 'TST', 5000000, 1000000, 5.00, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  -- Create a cap table for the test project
  INSERT INTO cap_tables (id, project_id, name, description, created_at, updated_at)
  VALUES (test_cap_table_id, test_project_id, 'Test Cap Table', 'Cap table for test project', NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  -- Create 5 test investors
  INSERT INTO investors (investor_id, name, email, type, kyc_status, created_at, updated_at)
  VALUES 
  (gen_random_uuid(), 'John Doe', 'john@example.com', 'individual', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'Jane Smith', 'jane@example.com', 'individual', 'pending', NOW(), NOW()),
  (gen_random_uuid(), 'Acme Corp', 'info@acme.com', 'entity', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'Bob Johnson', 'bob@example.com', 'individual', 'not_started', NOW(), NOW()),
  (gen_random_uuid(), 'Global Ventures', 'info@globalventures.com', 'entity', 'approved', NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  -- Get the investor IDs
  FOR inv_record IN SELECT investor_id FROM investors LIMIT 5 LOOP
    -- Create subscriptions for each investor
    INSERT INTO subscriptions (id, project_id, investor_id, subscription_id, currency, fiat_amount, subscription_date, confirmed, allocated, distributed, created_at, updated_at)
    VALUES (gen_random_uuid(), test_project_id, inv_record.investor_id, 'SUB-' || floor(random() * 1000)::text, 'USD', floor(random() * 100000), NOW(), random() > 0.5, random() > 0.5, random() > 0.5, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Get the subscription IDs for this project to create token allocations
  FOR sub_record IN SELECT id FROM subscriptions WHERE project_id = test_project_id LOOP
    -- Create token allocations for each subscription
    -- Alternate between distributed = true and distributed = false
    IF random() > 0.5 THEN
      INSERT INTO token_allocations (id, subscription_id, token_amount, token_type, distributed, created_at)
      VALUES (gen_random_uuid(), sub_record.id, floor(random() * 10000), 'ERC20', true, NOW())
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO token_allocations (id, subscription_id, token_amount, token_type, distributed, created_at)
      VALUES (gen_random_uuid(), sub_record.id, floor(random() * 10000), 'ERC20', false, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  -- Create some compliance checks
  FOR inv_record IN SELECT investor_id FROM investors LIMIT 3 LOOP
    INSERT INTO compliance_checks (id, project_id, investor_id, status, risk_level, risk_reason, created_at, updated_at)
    VALUES (gen_random_uuid(), test_project_id, inv_record.investor_id, 'pending', 
      CASE floor(random() * 3)
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        ELSE 'high'
      END,
      'Needs verification', NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Output the test project ID for reference
  RAISE NOTICE 'Created or updated test project with ID: %', test_project_id;
END$$;