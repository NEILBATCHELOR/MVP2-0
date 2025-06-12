-- Check for existing primary key constraints
DO $$
BEGIN
    -- Check if there's already a primary key defined
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.rules'::regclass 
        AND contype = 'p'
    ) THEN
        -- Add PRIMARY KEY constraint only if it doesn't exist
        ALTER TABLE "public"."rules" 
        ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("rule_id");
        
        RAISE NOTICE 'Added primary key constraint to rules table';
    ELSE
        RAISE NOTICE 'Primary key already exists on rules table. Skipping primary key creation.';
    END IF;
END $$;

-- Update rules table to have unique rule_id (if not already unique via PK)
DO $$
BEGIN
    -- Add unique constraint only if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.rules'::regclass 
        AND conname = 'rules_rule_id_unique'
    ) THEN
        -- Check if rule_id is already unique through a different constraint
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public.rules'::regclass 
            AND contype = 'u' 
            AND conkey @> ARRAY[(
                SELECT attnum FROM pg_attribute 
                WHERE attrelid = 'public.rules'::regclass 
                AND attname = 'rule_id'
            )]::smallint[]
        ) THEN
            -- Only add the unique constraint if rule_id isn't already unique
            ALTER TABLE "public"."rules"
            ADD CONSTRAINT "rules_rule_id_unique" UNIQUE ("rule_id");
            
            RAISE NOTICE 'Added unique constraint to rule_id column';
        ELSE
            RAISE NOTICE 'rule_id column is already unique. Skipping unique constraint creation.';
        END IF;
    ELSE
        RAISE NOTICE 'rules_rule_id_unique constraint already exists. Skipping.';
    END IF;
END $$;

-- Log migration
INSERT INTO "public"."system_settings" (key, value)
VALUES ('migration_20240802000001', 'Ensured rule_id column has unique constraint')
ON CONFLICT (key) DO NOTHING;