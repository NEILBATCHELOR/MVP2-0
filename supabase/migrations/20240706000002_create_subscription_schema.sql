-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR NOT NULL, -- 'monthly', 'quarterly', 'annual'
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR NOT NULL, -- 'active', 'canceled', 'expired', 'trial'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  billing_cycle VARCHAR NOT NULL, -- 'monthly', 'quarterly', 'annual'
  price DECIMAL(10, 2) NOT NULL,
  payment_method JSONB,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_invoices table
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR NOT NULL, -- 'paid', 'pending', 'failed', 'canceled'
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  invoice_number VARCHAR,
  payment_method JSONB,
  billing_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_events table for tracking important events
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL, -- 'created', 'renewed', 'canceled', 'payment_failed', etc.
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);

-- Enable RLS
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_events;

-- Insert some default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features) VALUES
('Basic', 'Essential features for small projects', 49.99, 'monthly', '{"max_projects": 3, "max_investors": 50, "support": "email", "reports": ["basic"]}'::jsonb),
('Professional', 'Advanced features for growing businesses', 99.99, 'monthly', '{"max_projects": 10, "max_investors": 200, "support": "priority", "reports": ["basic", "advanced"], "waterfall_modeling": true}'::jsonb),
('Enterprise', 'Comprehensive solution for large organizations', 199.99, 'monthly', '{"max_projects": -1, "max_investors": -1, "support": "dedicated", "reports": ["basic", "advanced", "custom"], "waterfall_modeling": true, "scenario_planning": true, "api_access": true}'::jsonb);
