-- Creates a stored procedure that creates a project and its associated cap table in a single transaction
CREATE OR REPLACE FUNCTION create_project_with_cap_table(
  project_data JSONB,
  cap_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
DECLARE
  created_project JSONB;
  project_id UUID;
  duration_value TEXT;
  sub_start_date TEXT;
  sub_end_date TEXT;
  trans_start_date TEXT;
  maturity_date_value TEXT;
BEGIN
  -- Handle the duration field and date fields specially
  duration_value := project_data->>'duration';
  sub_start_date := project_data->>'subscription_start_date';
  sub_end_date := project_data->>'subscription_end_date';
  trans_start_date := project_data->>'transaction_start_date';
  maturity_date_value := project_data->>'maturity_date';
  
  -- Insert the project
  INSERT INTO projects (
    name,
    description,
    project_type,
    token_symbol,
    target_raise,
    authorized_shares,
    share_price,
    company_valuation,
    legal_entity,
    jurisdiction,
    tax_id,
    status,
    is_primary,
    investment_status,
    estimated_yield_percentage,
    duration,
    subscription_start_date,
    subscription_end_date,
    transaction_start_date,
    maturity_date,
    currency,
    minimum_investment,
    total_notional,
    created_at,
    updated_at
  )
  VALUES (
    project_data->>'name',
    project_data->>'description',
    project_data->>'project_type',
    project_data->>'token_symbol',
    (project_data->>'target_raise')::numeric,
    (project_data->>'authorized_shares')::integer,
    (project_data->>'share_price')::numeric,
    (project_data->>'company_valuation')::numeric,
    project_data->>'legal_entity',
    project_data->>'jurisdiction',
    project_data->>'tax_id',
    project_data->>'status',
    (project_data->>'is_primary')::boolean,
    COALESCE(project_data->>'investment_status', 'Open'),
    (project_data->>'estimated_yield_percentage')::numeric,
    CASE
      WHEN duration_value IS NULL OR duration_value = '' THEN NULL
      ELSE duration_value::public.project_duration
    END,
    CASE
      WHEN sub_start_date IS NULL OR sub_start_date = '' THEN NULL
      ELSE sub_start_date::timestamp with time zone
    END,
    CASE
      WHEN sub_end_date IS NULL OR sub_end_date = '' THEN NULL
      ELSE sub_end_date::timestamp with time zone
    END,
    CASE
      WHEN trans_start_date IS NULL OR trans_start_date = '' THEN NULL
      ELSE trans_start_date::timestamp with time zone
    END,
    CASE
      WHEN maturity_date_value IS NULL OR maturity_date_value = '' THEN NULL
      ELSE maturity_date_value::timestamp with time zone
    END,
    COALESCE(project_data->>'currency', 'USD'),
    (project_data->>'minimum_investment')::numeric,
    (project_data->>'total_notional')::numeric,
    COALESCE((project_data->>'created_at')::timestamp with time zone, now()),
    COALESCE((project_data->>'updated_at')::timestamp with time zone, now())
  )
  RETURNING id INTO project_id;

  -- Create a cap table for this project
  INSERT INTO cap_tables (
    project_id,
    name,
    created_at,
    updated_at,
    description
  )
  VALUES (
    project_id,
    cap_table_name,
    COALESCE((project_data->>'created_at')::timestamp with time zone, now()),
    COALESCE((project_data->>'updated_at')::timestamp with time zone, now()),
    NULL
  );

  -- Get the created project to return
  SELECT row_to_json(p)::jsonb INTO created_project
  FROM projects p
  WHERE p.id = project_id;

  RETURN created_project;
END;
$$; 