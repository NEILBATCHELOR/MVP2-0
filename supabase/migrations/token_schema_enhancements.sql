-- Token Schema Enhancements SQL Migration
-- This script enhances the token-related database schema to provide better support for different token standards
-- with dedicated tables and validation rules.

-- Safety check - make sure all existing standard values align with our enum
DO $$
DECLARE
    invalid_standards TEXT;
    invalid_modes TEXT;
    invalid_statuses TEXT;
    tokens_exist BOOLEAN;
BEGIN
    -- First check if the tokens table even exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tokens'
    ) INTO tokens_exist;
    
    -- Only run validation if tokens table exists
    IF tokens_exist THEN
        -- Check for invalid standards
        SELECT string_agg(standard, ', ') INTO invalid_standards
        FROM public.tokens
        WHERE standard IS NOT NULL AND standard NOT IN ('ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525', 'ERC-4626');
        
        IF invalid_standards IS NOT NULL THEN
            RAISE EXCEPTION 'Found non-standard token values in the database: %', invalid_standards;
        END IF;
        
        -- Check for invalid config modes
        SELECT string_agg(config_mode, ', ') INTO invalid_modes
        FROM public.tokens
        WHERE config_mode IS NOT NULL AND config_mode NOT IN ('min', 'max', 'basic', 'advanced');
        
        IF invalid_modes IS NOT NULL THEN
            RAISE EXCEPTION 'Found invalid config_mode values in the database: %', invalid_modes;
        END IF;
        
        -- Check for invalid status values
        SELECT string_agg(status, ', ') INTO invalid_statuses
        FROM public.tokens
        WHERE status IS NOT NULL AND status NOT IN ('DRAFT', 'UNDER REVIEW', 'APPROVED', 'READY TO MINT', 'MINTED', 'DEPLOYED', 'PAUSED', 'DISTRIBUTED', 'REJECTED');
        
        IF invalid_statuses IS NOT NULL THEN
            RAISE EXCEPTION 'Found invalid status values in the database: %', invalid_statuses;
        END IF;
    END IF;
END $$;

-- First, let's create ENUMs for token standards and configuration modes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_standard_enum') THEN
        CREATE TYPE "public"."token_standard_enum" AS ENUM (
            'ERC-20',
            'ERC-721',
            'ERC-1155',
            'ERC-1400',
            'ERC-3525',
            'ERC-4626'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_config_mode_enum') THEN
        CREATE TYPE "public"."token_config_mode_enum" AS ENUM (
            'min',
            'max',
            'basic',
            'advanced'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_status_enum') THEN
        CREATE TYPE "public"."token_status_enum" AS ENUM (
            'DRAFT',
            'UNDER REVIEW',
            'APPROVED',
            'READY TO MINT',
            'MINTED',
            'DEPLOYED',
            'PAUSED',
            'DISTRIBUTED',
            'REJECTED'
        );
    END IF;
END $$;

-- Check if the tokens table exists before proceeding with alterations
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tokens'
    ) THEN
        -- Check if config_mode column exists, if not add it as a text column first
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'tokens' AND column_name = 'config_mode'
        ) THEN
            ALTER TABLE "public"."tokens" ADD COLUMN "config_mode" TEXT DEFAULT 'min';
        END IF;

        -- Update any NULL values to default values before changing types
        UPDATE "public"."tokens" SET "status" = 'DRAFT' WHERE "status" IS NULL;
        UPDATE "public"."tokens" SET "config_mode" = 'min' WHERE "config_mode" IS NULL;
        
        -- First drop the default constraints
        ALTER TABLE "public"."tokens" ALTER COLUMN "status" DROP DEFAULT;
        ALTER TABLE "public"."tokens" ALTER COLUMN "config_mode" DROP DEFAULT;

        -- Now alter the columns to use enum types, one by one to make errors easier to diagnose
        BEGIN
            ALTER TABLE "public"."tokens" 
                DROP CONSTRAINT IF EXISTS "tokens_standard_check";
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error dropping tokens_standard_check constraint: %', SQLERRM;
        END;

        BEGIN
            ALTER TABLE "public"."tokens" 
                ALTER COLUMN "standard" TYPE "public"."token_standard_enum" USING "standard"::"public"."token_standard_enum";
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Error converting standard column: %', SQLERRM;
        END;

        BEGIN
            ALTER TABLE "public"."tokens" 
                ALTER COLUMN "status" TYPE "public"."token_status_enum" USING "status"::"public"."token_status_enum";
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Error converting status column: %', SQLERRM;
        END;

        BEGIN
            ALTER TABLE "public"."tokens" 
                ALTER COLUMN "config_mode" TYPE "public"."token_config_mode_enum" USING "config_mode"::"public"."token_config_mode_enum";
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Error converting config_mode column: %', SQLERRM;
        END;

        -- Re-add the default values using the enum types
        ALTER TABLE "public"."tokens" 
            ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."token_status_enum",
            ALTER COLUMN "config_mode" SET DEFAULT 'min'::"public"."token_config_mode_enum";
    END IF;
END $$;

-- Add standard-specific tables for token properties
-- ERC20 Token Properties
CREATE TABLE IF NOT EXISTS "public"."token_erc20_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "initial_supply" TEXT,
    "cap" TEXT,
    "is_mintable" BOOLEAN DEFAULT FALSE,
    "is_burnable" BOOLEAN DEFAULT FALSE,
    "is_pausable" BOOLEAN DEFAULT FALSE,
    "token_type" TEXT DEFAULT 'utility',
    "access_control" TEXT DEFAULT 'ownable',
    "allow_management" BOOLEAN DEFAULT FALSE,
    "permit" BOOLEAN DEFAULT FALSE,
    "snapshot" BOOLEAN DEFAULT FALSE,
    "fee_on_transfer" JSONB,
    "rebasing" JSONB,
    "governance_features" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE,
    CONSTRAINT "one_property_per_token" UNIQUE ("token_id")
);

-- ERC721 Token Properties
CREATE TABLE IF NOT EXISTS "public"."token_erc721_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "base_uri" TEXT,
    "metadata_storage" TEXT DEFAULT 'ipfs',
    "max_supply" TEXT,
    "has_royalty" BOOLEAN DEFAULT FALSE,
    "royalty_percentage" TEXT,
    "royalty_receiver" TEXT,
    "is_burnable" BOOLEAN DEFAULT FALSE,
    "is_pausable" BOOLEAN DEFAULT FALSE,
    "asset_type" TEXT DEFAULT 'unique_asset',
    "minting_method" TEXT DEFAULT 'open',
    "auto_increment_ids" BOOLEAN DEFAULT TRUE,
    "enumerable" BOOLEAN DEFAULT TRUE,
    "uri_storage" TEXT DEFAULT 'tokenId',
    "access_control" TEXT DEFAULT 'ownable',
    "updatable_uris" BOOLEAN DEFAULT FALSE,
    "sales_config" JSONB,
    "whitelist_config" JSONB,
    "permission_config" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE,
    CONSTRAINT "one_erc721_property_per_token" UNIQUE ("token_id")
);

-- ERC1155 Token Properties
CREATE TABLE IF NOT EXISTS "public"."token_erc1155_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "base_uri" TEXT,
    "metadata_storage" TEXT DEFAULT 'ipfs',
    "has_royalty" BOOLEAN DEFAULT FALSE,
    "royalty_percentage" TEXT,
    "royalty_receiver" TEXT,
    "is_burnable" BOOLEAN DEFAULT FALSE,
    "is_pausable" BOOLEAN DEFAULT FALSE,
    "access_control" TEXT DEFAULT 'ownable',
    "updatable_uris" BOOLEAN DEFAULT FALSE,
    "supply_tracking" BOOLEAN DEFAULT TRUE,
    "enable_approval_for_all" BOOLEAN DEFAULT TRUE,
    "sales_config" JSONB,
    "whitelist_config" JSONB,
    "batch_transfer_limits" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE,
    CONSTRAINT "one_erc1155_property_per_token" UNIQUE ("token_id")
);

-- ERC1400 Token Properties
CREATE TABLE IF NOT EXISTS "public"."token_erc1400_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "initial_supply" TEXT,
    "cap" TEXT,
    "is_mintable" BOOLEAN DEFAULT FALSE,
    "is_burnable" BOOLEAN DEFAULT FALSE,
    "is_pausable" BOOLEAN DEFAULT FALSE,
    "document_uri" TEXT,
    "document_hash" TEXT,
    "controller_address" TEXT,
    "require_kyc" BOOLEAN DEFAULT TRUE,
    "security_type" TEXT DEFAULT 'equity',
    "issuing_jurisdiction" TEXT,
    "issuing_entity_name" TEXT,
    "issuing_entity_lei" TEXT,
    "transfer_restrictions" JSONB,
    "kyc_settings" JSONB,
    "compliance_settings" JSONB,
    "forced_transfers" BOOLEAN DEFAULT FALSE,
    "issuance_modules" BOOLEAN DEFAULT FALSE,
    "document_management" BOOLEAN DEFAULT FALSE,
    "recovery_mechanism" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE,
    CONSTRAINT "one_erc1400_property_per_token" UNIQUE ("token_id")
);

-- ERC3525 Token Properties
CREATE TABLE IF NOT EXISTS "public"."token_erc3525_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "value_decimals" INTEGER DEFAULT 0,
    "base_uri" TEXT,
    "metadata_storage" TEXT DEFAULT 'ipfs',
    "slot_type" TEXT DEFAULT 'generic',
    "is_burnable" BOOLEAN DEFAULT FALSE,
    "is_pausable" BOOLEAN DEFAULT FALSE,
    "has_royalty" BOOLEAN DEFAULT FALSE,
    "royalty_percentage" TEXT,
    "royalty_receiver" TEXT,
    "slot_approvals" BOOLEAN DEFAULT TRUE,
    "value_approvals" BOOLEAN DEFAULT TRUE,
    "access_control" TEXT DEFAULT 'ownable',
    "updatable_uris" BOOLEAN DEFAULT FALSE,
    "updatable_slots" BOOLEAN DEFAULT FALSE,
    "value_transfers_enabled" BOOLEAN DEFAULT TRUE,
    "sales_config" JSONB,
    "mergable" BOOLEAN DEFAULT FALSE,
    "splittable" BOOLEAN DEFAULT FALSE,
    "slot_transfer_validation" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE,
    CONSTRAINT "one_erc3525_property_per_token" UNIQUE ("token_id")
);

-- ERC4626 Token Properties
CREATE TABLE IF NOT EXISTS "public"."token_erc4626_properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "asset_address" TEXT,
    "asset_name" TEXT,
    "asset_symbol" TEXT,
    "asset_decimals" INTEGER DEFAULT 18,
    "vault_type" TEXT DEFAULT 'yield',
    "is_mintable" BOOLEAN DEFAULT FALSE,
    "is_burnable" BOOLEAN DEFAULT FALSE,
    "is_pausable" BOOLEAN DEFAULT FALSE,
    "vault_strategy" TEXT DEFAULT 'simple',
    "custom_strategy" BOOLEAN DEFAULT FALSE,
    "strategy_controller" TEXT,
    "access_control" TEXT DEFAULT 'ownable',
    "permit" BOOLEAN DEFAULT FALSE,
    "flash_loans" BOOLEAN DEFAULT FALSE,
    "emergency_shutdown" BOOLEAN DEFAULT FALSE,
    "fee_structure" JSONB,
    "rebalancing_rules" JSONB,
    "performance_metrics" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE,
    CONSTRAINT "one_erc4626_property_per_token" UNIQUE ("token_id")
);

-- Create tables for array items

-- ERC1155 Token Types
CREATE TABLE IF NOT EXISTS "public"."token_erc1155_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "token_type_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "max_supply" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC1155 Initial Balances
CREATE TABLE IF NOT EXISTS "public"."token_erc1155_balances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "token_type_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC1155 URI Mappings
CREATE TABLE IF NOT EXISTS "public"."token_erc1155_uri_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "token_type_id" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC721 Token Attributes
CREATE TABLE IF NOT EXISTS "public"."token_erc721_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "trait_type" TEXT NOT NULL,
    "values" TEXT[] NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC3525 Slots
CREATE TABLE IF NOT EXISTS "public"."token_erc3525_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "slot_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC3525 Initial Allocations
CREATE TABLE IF NOT EXISTS "public"."token_erc3525_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "slot_id" TEXT NOT NULL,
    "token_id_within_slot" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC1400 Partitions
CREATE TABLE IF NOT EXISTS "public"."token_erc1400_partitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "partition_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC1400 Controllers
CREATE TABLE IF NOT EXISTS "public"."token_erc1400_controllers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "permissions" TEXT[],
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC4626 Strategy Parameters
CREATE TABLE IF NOT EXISTS "public"."token_erc4626_strategy_params" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- ERC4626 Asset Allocations
CREATE TABLE IF NOT EXISTS "public"."token_erc4626_asset_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_id" UUID NOT NULL,
    "asset" TEXT NOT NULL,
    "percentage" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE
);

-- Create views for token details with standard-specific properties
CREATE OR REPLACE VIEW "public"."token_erc20_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.initial_supply,
    p.cap,
    p.is_mintable,
    p.is_burnable,
    p.is_pausable,
    p.token_type,
    p.access_control,
    p.allow_management,
    p.permit,
    p.snapshot,
    p.fee_on_transfer,
    p.rebasing,
    p.governance_features,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc20_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-20';

CREATE OR REPLACE VIEW "public"."token_erc721_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.base_uri,
    p.metadata_storage,
    p.max_supply,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.is_burnable,
    p.is_pausable,
    p.asset_type,
    p.minting_method,
    p.auto_increment_ids,
    p.enumerable,
    p.uri_storage,
    p.access_control,
    p.updatable_uris,
    p.sales_config,
    p.whitelist_config,
    p.permission_config,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc721_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-721';

CREATE OR REPLACE VIEW "public"."token_erc1155_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.base_uri,
    p.metadata_storage,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.is_burnable,
    p.is_pausable,
    p.access_control,
    p.updatable_uris,
    p.supply_tracking,
    p.enable_approval_for_all,
    p.sales_config,
    p.whitelist_config,
    p.batch_transfer_limits,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc1155_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-1155';

CREATE OR REPLACE VIEW "public"."token_erc1400_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.initial_supply,
    p.cap,
    p.is_mintable,
    p.is_burnable,
    p.is_pausable,
    p.document_uri,
    p.document_hash,
    p.controller_address,
    p.require_kyc,
    p.security_type,
    p.issuing_jurisdiction,
    p.issuing_entity_name,
    p.issuing_entity_lei,
    p.transfer_restrictions,
    p.kyc_settings,
    p.compliance_settings,
    p.forced_transfers,
    p.issuance_modules,
    p.document_management,
    p.recovery_mechanism,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc1400_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-1400';

CREATE OR REPLACE VIEW "public"."token_erc3525_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.value_decimals,
    p.base_uri,
    p.metadata_storage,
    p.slot_type,
    p.is_burnable,
    p.is_pausable,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.slot_approvals,
    p.value_approvals,
    p.access_control,
    p.updatable_uris,
    p.updatable_slots,
    p.value_transfers_enabled,
    p.sales_config,
    p.mergable,
    p.splittable,
    p.slot_transfer_validation,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc3525_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-3525';

CREATE OR REPLACE VIEW "public"."token_erc4626_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.asset_address,
    p.asset_name,
    p.asset_symbol,
    p.asset_decimals,
    p.vault_type,
    p.is_mintable,
    p.is_burnable,
    p.is_pausable,
    p.vault_strategy,
    p.custom_strategy,
    p.strategy_controller,
    p.access_control,
    p.permit,
    p.flash_loans,
    p.emergency_shutdown,
    p.fee_structure,
    p.rebalancing_rules,
    p.performance_metrics,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc4626_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-4626';

-- Create Triggers to automatically update the corresponding properties tables when a token is inserted/updated
CREATE OR REPLACE FUNCTION "public"."insert_token_properties"() RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.standard
        WHEN 'ERC-20' THEN
            INSERT INTO "public"."token_erc20_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-721' THEN
            INSERT INTO "public"."token_erc721_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-1155' THEN
            INSERT INTO "public"."token_erc1155_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-1400' THEN
            INSERT INTO "public"."token_erc1400_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-3525' THEN
            INSERT INTO "public"."token_erc3525_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-4626' THEN
            INSERT INTO "public"."token_erc4626_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        ELSE
            -- Do nothing for unknown standards
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "token_insert_trigger"
AFTER INSERT ON "public"."tokens"
FOR EACH ROW
EXECUTE FUNCTION "public"."insert_token_properties"();

-- Function to migrate existing JSON data to structured tables
CREATE OR REPLACE FUNCTION "public"."migrate_token_json_to_tables"() RETURNS void AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Process ERC20 tokens
    FOR token_record IN SELECT * FROM "public"."tokens" WHERE standard = 'ERC-20' LOOP
        INSERT INTO "public"."token_erc20_properties" (
            token_id, 
            initial_supply, 
            cap, 
            is_mintable, 
            is_burnable, 
            is_pausable,
            token_type,
            access_control,
            allow_management,
            permit,
            snapshot,
            fee_on_transfer,
            rebasing,
            governance_features
        ) VALUES (
            token_record.id,
            token_record.total_supply,
            (token_record.blocks->>'cap')::text,
            (token_record.blocks->>'is_mintable')::boolean,
            (token_record.blocks->>'is_burnable')::boolean,
            (token_record.blocks->>'is_pausable')::boolean,
            (token_record.metadata->>'tokenType')::text,
            (token_record.blocks->>'access_control')::text,
            (token_record.blocks->>'allowance_management')::boolean,
            (token_record.blocks->>'permit')::boolean,
            (token_record.blocks->>'snapshot')::boolean,
            token_record.blocks->'fee_on_transfer',
            token_record.blocks->'rebasing',
            token_record.blocks->'governance_features'
        ) ON CONFLICT (token_id) DO UPDATE SET
            initial_supply = EXCLUDED.initial_supply,
            cap = EXCLUDED.cap,
            is_mintable = EXCLUDED.is_mintable,
            is_burnable = EXCLUDED.is_burnable,
            is_pausable = EXCLUDED.is_pausable,
            token_type = EXCLUDED.token_type,
            access_control = EXCLUDED.access_control,
            allow_management = EXCLUDED.allow_management,
            permit = EXCLUDED.permit,
            snapshot = EXCLUDED.snapshot,
            fee_on_transfer = EXCLUDED.fee_on_transfer,
            rebasing = EXCLUDED.rebasing,
            governance_features = EXCLUDED.governance_features;
    END LOOP;
    
    -- Process ERC721 tokens
    FOR token_record IN SELECT * FROM "public"."tokens" WHERE standard = 'ERC-721' LOOP
        INSERT INTO "public"."token_erc721_properties" (
            token_id,
            base_uri,
            metadata_storage,
            max_supply,
            has_royalty,
            royalty_percentage,
            royalty_receiver,
            is_burnable,
            is_pausable,
            asset_type,
            minting_method,
            auto_increment_ids,
            enumerable,
            uri_storage,
            access_control,
            updatable_uris,
            sales_config,
            whitelist_config,
            permission_config
        ) VALUES (
            token_record.id,
            (token_record.blocks->>'base_uri')::text,
            (token_record.blocks->>'metadata_storage')::text,
            (token_record.blocks->>'max_supply')::text,
            (token_record.blocks->>'has_royalty')::boolean,
            (token_record.blocks->>'royalty_percentage')::text,
            (token_record.blocks->>'royalty_receiver')::text,
            (token_record.blocks->>'is_burnable')::boolean,
            (token_record.blocks->>'is_pausable')::boolean,
            (token_record.blocks->>'asset_type')::text,
            (token_record.blocks->>'minting_method')::text,
            (token_record.blocks->>'auto_increment_ids')::boolean,
            (token_record.blocks->>'enumerable')::boolean,
            (token_record.blocks->>'uri_storage')::text,
            (token_record.blocks->>'access_control')::text,
            (token_record.blocks->>'updatable_uris')::boolean,
            token_record.blocks->'sales_config',
            token_record.blocks->'whitelist_config',
            token_record.blocks->'permission_config'
        ) ON CONFLICT (token_id) DO UPDATE SET
            base_uri = EXCLUDED.base_uri,
            metadata_storage = EXCLUDED.metadata_storage,
            max_supply = EXCLUDED.max_supply,
            has_royalty = EXCLUDED.has_royalty,
            royalty_percentage = EXCLUDED.royalty_percentage,
            royalty_receiver = EXCLUDED.royalty_receiver,
            is_burnable = EXCLUDED.is_burnable,
            is_pausable = EXCLUDED.is_pausable,
            asset_type = EXCLUDED.asset_type,
            minting_method = EXCLUDED.minting_method,
            auto_increment_ids = EXCLUDED.auto_increment_ids,
            enumerable = EXCLUDED.enumerable,
            uri_storage = EXCLUDED.uri_storage,
            access_control = EXCLUDED.access_control,
            updatable_uris = EXCLUDED.updatable_uris,
            sales_config = EXCLUDED.sales_config,
            whitelist_config = EXCLUDED.whitelist_config,
            permission_config = EXCLUDED.permission_config;

        -- Migrate token attributes array
        IF token_record.blocks->'token_attributes' IS NOT NULL AND jsonb_array_length(token_record.blocks->'token_attributes') > 0 THEN
            FOR i IN 0..jsonb_array_length(token_record.blocks->'token_attributes')-1 LOOP
                INSERT INTO "public"."token_erc721_attributes" (
                    token_id,
                    trait_type,
                    values
                ) VALUES (
                    token_record.id,
                    (token_record.blocks->'token_attributes'->i->>'trait_type')::text,
                    (SELECT array_agg(v.value) 
                     FROM jsonb_array_elements_text(token_record.blocks->'token_attributes'->i->'values') as v(value))
                );
            END LOOP;
        END IF;
    END LOOP;

    -- Process other token standards similarly...
    -- (Add more token migration logic here - would need similar blocks for each token standard)
END;
$$ LANGUAGE plpgsql;

-- Create a timestamp function for updated_at columns
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers for all property tables
CREATE TRIGGER update_token_erc20_properties_timestamp BEFORE UPDATE
ON token_erc20_properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_token_erc721_properties_timestamp BEFORE UPDATE
ON token_erc721_properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_token_erc1155_properties_timestamp BEFORE UPDATE
ON token_erc1155_properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_token_erc1400_properties_timestamp BEFORE UPDATE
ON token_erc1400_properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_token_erc3525_properties_timestamp BEFORE UPDATE
ON token_erc3525_properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_token_erc4626_properties_timestamp BEFORE UPDATE
ON token_erc4626_properties FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();