#!/usr/bin/env node

/**
 * Simple script to check permissions from the command line
 * Usage:
 *   node check-permission.js <user_id> <permission_name>
 *   
 * Example:
 *   node check-permission.js 52cb94b9-2809-4c3a-89ef-38adb778ab41 policies.approve
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkPermission(userId, permissionName) {
  console.log(`Checking if user ${userId} has permission ${permissionName}...`);
  
  try {
    // First get the user's info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    // Get user role
    const { data: userRole, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .single();
      
    if (userRoleError) {
      console.error('Error fetching user role:', userRoleError);
      return;
    }
    
    // Get role name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('name')
      .eq('id', userRole.role_id)
      .single();
      
    if (roleError) {
      console.error('Error fetching role:', roleError);
      return;
    }
    
    console.log(`User: ${user.name} (${user.email}), Role: ${role.name}`);
    
    // Check permission using the database function
    try {
      const { data: hasPermission, error: permError } = await supabase
        .rpc('check_user_permission', {
          user_id: userId,
          permission: permissionName
        });
      
      if (permError) {
        console.error('Error checking permission with function:', permError);
      } else {
        console.log(`Result from check_user_permission: ${hasPermission ? 'ALLOWED' : 'DENIED'}`);
      }
    } catch (fnError) {
      console.error('Function call failed:', fnError);
    }
    
    // Also get roles that have this permission as additional information
    try {
      const { data: rolePerms, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('role_id')
        .eq('permission_name', permissionName);
      
      if (rolePermsError) {
        console.error('Error checking role permissions:', rolePermsError);
      } else if (rolePerms && rolePerms.length > 0) {
        const roleIds = rolePerms.map(rp => rp.role_id);
        
        // Get role names
        const { data: roles, error: rolesError } = await supabase
          .from('roles')
          .select('id, name, priority')
          .in('id', roleIds);
        
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
        } else {
          console.log('\nRoles that have this permission:');
          roles.forEach(role => {
            console.log(`- ${role.name} (ID: ${role.id}, Priority: ${role.priority})`);
          });
        }
        
        // Check if the user has any of these roles in user_roles
        const { data: userRoles, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', userId);
        
        if (userRolesError) {
          console.error('Error fetching user roles:', userRolesError);
        } else if (userRoles && userRoles.length > 0) {
          const userRoleIds = userRoles.map(ur => ur.role_id);
          
          console.log('\nUser assigned roles:');
          const matchingRoles = roles.filter(role => userRoleIds.includes(role.id));
          
          if (matchingRoles.length > 0) {
            matchingRoles.forEach(role => {
              console.log(`- ${role.name} (gives this permission)`);
            });
          } else {
            const { data: allRoles, error: allRolesError } = await supabase
              .from('roles')
              .select('id, name')
              .in('id', userRoleIds);
            
            if (allRolesError) {
              console.error('Error fetching assigned roles:', allRolesError);
            } else if (allRoles && allRoles.length > 0) {
              allRoles.forEach(role => {
                console.log(`- ${role.name} (does NOT give this permission)`);
              });
            } else {
              console.log('No roles found in user_roles table');
            }
          }
        } else {
          console.log('\nUser has no roles assigned in user_roles table');
        }
      } else {
        console.log('\nNo roles have this permission');
      }
    } catch (checkError) {
      console.error('Error checking roles with permission:', checkError);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Main execution
const userId = process.argv[2];
const permissionName = process.argv[3];

if (!userId || !permissionName) {
  console.log('Usage: node check-permission.js <user_id> <permission_name>');
  console.log('Example: node check-permission.js 52cb94b9-2809-4c3a-89ef-38adb778ab41 policies.approve');
  process.exit(1);
}

checkPermission(userId, permissionName)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });