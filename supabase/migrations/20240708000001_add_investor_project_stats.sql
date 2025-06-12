-- Add functions to calculate investor statistics

-- Function to count projects for an investor
CREATE OR REPLACE FUNCTION get_investor_project_count(p_investor_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT project_id) INTO v_count
  FROM cap_table_investors cti
  JOIN cap_tables ct ON cti.cap_table_id = ct.id
  WHERE cti.investor_id = p_investor_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total investment amount for an investor
CREATE OR REPLACE FUNCTION get_investor_total_investment(p_investor_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(fiat_amount), 0) INTO v_total
  FROM subscriptions
  WHERE investor_id = p_investor_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get new investors in the last 30 days
CREATE OR REPLACE FUNCTION get_new_investors_count(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM investors
  WHERE created_at >= NOW() - (p_days * INTERVAL '1 day');
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get allocation for the current quarter
CREATE OR REPLACE FUNCTION get_allocation_current_quarter()
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
  v_quarter_start DATE;
  v_quarter_end DATE;
BEGIN
  -- Calculate current quarter start and end dates
  v_quarter_start := DATE_TRUNC('quarter', CURRENT_DATE);
  v_quarter_end := v_quarter_start + INTERVAL '3 months' - INTERVAL '1 day';
  
  -- Get sum of subscriptions in current quarter
  SELECT COALESCE(SUM(fiat_amount), 0) INTO v_total
  FROM subscriptions
  WHERE subscription_date::DATE BETWEEN v_quarter_start AND v_quarter_end;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for these functions
ALTER FUNCTION get_investor_project_count SECURITY DEFINER;
ALTER FUNCTION get_investor_total_investment SECURITY DEFINER;
ALTER FUNCTION get_new_investors_count SECURITY DEFINER;
ALTER FUNCTION get_allocation_current_quarter SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_investor_project_count TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_investor_total_investment TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_new_investors_count TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_allocation_current_quarter TO anon, authenticated, service_role;
