-- Direct approach to add unique constraint on rule_id without touching primary key

-- First, check if the unique constraint already exists
DO $$
BEGIN
    -- Check for existing unique constraint on rule_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.rules'::regclass 
        AND contype IN ('p', 'u')  -- Check for primary key or unique constraints
        AND conkey @> ARRAY[(
            SELECT attnum FROM pg_attribute 
            WHERE attrelid = 'public.rules'::regclass 
            AND attname = 'rule_id'
        )]::smallint[]
    ) THEN
        -- Add only the unique constraint 
        ALTER TABLE "public"."rules"
        ADD CONSTRAINT "rules_rule_id_unique" UNIQUE ("rule_id");
        
        RAISE NOTICE 'Added unique constraint on rule_id column';
    ELSE
        RAISE NOTICE 'rule_id column is already unique (primary key or unique constraint exists). No action needed.';
    END IF;
END $$;

-- Log migration
INSERT INTO "public"."system_settings" (key, value)
VALUES ('migration_20240802000002', 'Added unique constraint to rule_id column')
ON CONFLICT (key) DO NOTHING;