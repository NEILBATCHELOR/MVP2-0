-- This migration removes mock data and ensures tables exist before attempting to modify them

-- First, check if the documents table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  date_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  rejection_reason TEXT,
  file_url TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  user_id TEXT,
  organization_id TEXT,
  required BOOLEAN
);

-- Now it's safe to delete any mock data
DELETE FROM documents WHERE user_id = 'mock-user' OR organization_id = 'mock-org';

-- Create other tables if they don't exist
CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  completion_percentage INTEGER,
  organization_id TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE,
  blocked_at TIMESTAMP WITH TIME ZONE,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS whitelist_settings (
  id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  addresses TEXT[] DEFAULT '{}',
  address_labels JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS compliance_settings (
  id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL,
  kyc_status TEXT NOT NULL,
  require_accreditation BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_investment INTEGER NOT NULL DEFAULT 0,
  jurisdictions TEXT[] DEFAULT '{}',
  investor_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Remove any mock data from these tables
DELETE FROM workflow_stages WHERE organization_id = 'mock-org' OR organization_id = 'default-org';
DELETE FROM wallets WHERE organization_id = 'mock-org' OR organization_id = 'default-org';
DELETE FROM whitelist_settings WHERE organization_id = 'mock-org' OR organization_id = 'default-org';
DELETE FROM notifications WHERE user_id = 'mock-user' OR user_id = 'default-user';
DELETE FROM compliance_settings WHERE organization_id = 'mock-org' OR organization_id = 'default-org';
