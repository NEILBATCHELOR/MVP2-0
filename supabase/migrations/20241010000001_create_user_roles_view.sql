-- Create the user_roles_view
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  ur.user_id,
  ur.role_id,
  r.name AS role_name
FROM 
  public.user_roles ur
JOIN 
  public.roles r ON ur.role_id = r.id;