/**
 * Test script to verify the new permissions system
 * 
 * Run this script with:
 * npm run ts-node src/tests/testPermissions.ts
 */
import { supabase } from '@/infrastructure/database/client';
import type { Database } from '@/types/core/supabase';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// Define custom user type for the test
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

async function testPermissions() {
  console.log('Testing new permissions system...');
  
  try {
    // Test the get_users_with_permission function
    console.log('\n1. Testing get_users_with_permission function:');
    const { data: approverIds, error: approverError } = await supabase
      .rpc('get_users_with_permission', { 
        permission_name: 'policy_rules.approve' 
      });
    
    if (approverError) {
      console.error('Error calling get_users_with_permission:', approverError);
    } else {
      console.log(`Found ${approverIds?.length || 0} users with policy_rules.approve permission:`, approverIds);
    }
    
    // Test direct role_permissions query
    console.log('\n2. Testing direct role_permissions query:');
    let query = supabase
      .from('role_permissions')
      .select('role_id');
    
    query = (query as any).eq('permission_id', 'policy_rules.approve').eq('effect', 'allow');
    
    const { data: rolePerms, error: rolePermsError } = await query;
    
    if (rolePermsError) {
      console.error('Error fetching role_permissions:', rolePermsError);
    } else if (rolePerms) {
      const roleIds = rolePerms.map(rp => rp.role_id);
      console.log(`Found ${roleIds.length} roles with policy_rules.approve permission:`, roleIds);
      
      // Get role names
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .in('id', roleIds);
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      } else if (roles) {
        console.log('Roles with approve permission:', roles.map(r => r.name));
      }
    }
    
    // Test user roles - use type assertion since we know what columns we're selecting
    console.log('\n3. Testing user roles:');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else if (usersData && Array.isArray(usersData)) {
      // Use type assertion to tell TypeScript we know the structure
      const typedUsers = usersData as unknown as User[];
      console.log('User roles:');
      typedUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}): ${user.role}`);
      });
      
      // Test check_user_permission function
      if (typedUsers.length > 0) {
        console.log('\n4. Testing check_user_permission function:');
        const testUser = typedUsers[0];
        
        const { data: hasPermission, error: checkError } = await supabase
          .rpc('check_user_permission', { 
            user_id: testUser.id,
            permission: 'policy_rules.approve'
          });
        
        if (checkError) {
          console.error('Error calling check_user_permission:', checkError);
        } else {
          console.log(`User ${testUser.name} (${testUser.role}) has policy_rules.approve permission: ${hasPermission}`);
        }
      }
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

// Run the test
testPermissions().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
}); 