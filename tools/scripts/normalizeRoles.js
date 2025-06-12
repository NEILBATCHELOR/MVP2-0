/**
 * Script to normalize role names in the database
 * Run with: node src/scripts/normalizeRoles.js
 * 
 * This script will:
 * 1. Read all roles from the roles table
 * 2. Read all unique role values from users table
 * 3. Generate a mapping between user role values and roles table
 * 4. Create SQL to update the user_roles table
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Helper function to normalize a role name
function normalizeRoleName(roleName) {
  // Convert to lowercase and remove spaces
  return roleName.toLowerCase().replace(/\s+/g, '_');
}

// Helper function to find the best match between a user role and standard roles
function findBestRoleMatch(userRole, standardRoles) {
  // First try exact match after normalization
  const normalizedUserRole = normalizeRoleName(userRole);
  
  for (const role of standardRoles) {
    const normalizedStandardRole = normalizeRoleName(role.name);
    
    // Exact match
    if (normalizedUserRole === normalizedStandardRole) {
      return role;
    }
  }
  
  // Then try contains match
  for (const role of standardRoles) {
    const normalizedStandardRole = normalizeRoleName(role.name);
    
    // If the normalized user role contains the standard role or vice versa
    if (normalizedUserRole.includes(normalizedStandardRole) || 
        normalizedStandardRole.includes(normalizedUserRole)) {
      return role;
    }
    
    // Special cases
    if ((userRole === 'owner' && role.name.toLowerCase().includes('admin')) ||
        (userRole === 'superAdmin' && role.name.toLowerCase().includes('super')) ||
        (userRole === 'complianceManager' && role.name.toLowerCase().includes('compliance') && role.name.toLowerCase().includes('manager')) ||
        (userRole === 'compliance_officer' && role.name.toLowerCase().includes('compliance') && role.name.toLowerCase().includes('officer')) ||
        (userRole === 'basic_user' && role.name.toLowerCase().includes('agent'))) {
      return role;
    }
  }
  
  // No match found
  return null;
}

async function generateRoleMapping() {
  console.log('Generating role mapping...');
  
  try {
    // Fetch roles from the roles table
    const { data: standardRoles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, priority')
      .order('priority');
    
    if (rolesError) {
      throw new Error(`Error fetching roles: ${rolesError.message}`);
    }
    
    console.log('Standard roles:');
    standardRoles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id}, Priority: ${role.priority})`);
    });
    
    // Fetch all unique role values from users table
    const { data: userRoles, error: userRolesError } = await supabase
      .from('users')
      .select('role')
      .order('role');
    
    if (userRolesError) {
      throw new Error(`Error fetching user roles: ${userRolesError.message}`);
    }
    
    // Extract unique roles
    const uniqueUserRoles = [...new Set(userRoles.map(u => u.role))].filter(Boolean);
    
    console.log('\nUser roles found:');
    uniqueUserRoles.forEach(role => console.log(`- ${role}`));
    
    // Generate mapping
    const roleMapping = {};
    const unmappedRoles = [];
    
    for (const userRole of uniqueUserRoles) {
      const matchedRole = findBestRoleMatch(userRole, standardRoles);
      
      if (matchedRole) {
        roleMapping[userRole] = matchedRole;
      } else {
        unmappedRoles.push(userRole);
      }
    }
    
    // Print mapping
    console.log('\nRole mapping:');
    Object.entries(roleMapping).forEach(([userRole, standardRole]) => {
      console.log(`- ${userRole} => ${standardRole.name} (ID: ${standardRole.id})`);
    });
    
    if (unmappedRoles.length > 0) {
      console.log('\nUnmapped roles:');
      unmappedRoles.forEach(role => console.log(`- ${role}`));
    }
    
    // Generate SQL
    console.log('\nSQL to update user_roles table:');
    console.log('-- Run this SQL in your database to update user_roles');
    console.log('BEGIN;');
    
    // First, clean up existing user_roles table
    console.log('\n-- Clean up existing user_roles entries');
    console.log('DELETE FROM user_roles;');
    
    // Then insert new entries
    console.log('\n-- Insert new user_roles entries');
    
    console.log(`INSERT INTO user_roles (user_id, role)
SELECT u.id, r.name 
FROM users u
JOIN roles r ON 1=1
WHERE
  CASE`);
  
    Object.entries(roleMapping).forEach(([userRole, standardRole]) => {
      console.log(`    WHEN u.role = '${userRole}' THEN r.id = '${standardRole.id}'`);
    });
    
    console.log(`    ELSE false
  END;`);
    
    console.log('\nCOMMIT;');
    
    // Generate JavaScript to update user roles directly
    console.log('\nJavaScript to update user roles directly:');
    console.log(`
async function updateUserRoles() {
  const roleMapping = {`);
  
    Object.entries(roleMapping).forEach(([userRole, standardRole]) => {
      console.log(`    '${userRole}': '${standardRole.name}',`);
    });
    
    console.log(`  };

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, role');
  
  if (usersError) {
    throw new Error(\`Error fetching users: \${usersError.message}\`);
  }

  // Update user_roles table
  const updates = [];
  
  for (const user of users) {
    if (user.role && roleMapping[user.role]) {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: roleMapping[user.role]
        });
      
      if (error) {
        console.error(\`Error updating user \${user.id}: \${error.message}\`);
      } else {
        updates.push(user.id);
      }
    }
  }
  
  console.log(\`Updated \${updates.length} users\`);
}

updateUserRoles().catch(console.error);
`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateRoleMapping().catch(console.error); 