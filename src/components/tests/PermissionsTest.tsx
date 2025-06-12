import React, { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/auth/usePermissions.tsx';
import { useApprovers } from '@/hooks/rule/useApprovers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';

/**
 * Component to test that permissions are working properly
 */
export const PermissionsTest: React.FC = () => {
  const { hasPermission, isChecking, cachedPermissions } = usePermissions();
  const { approvers, isLoading: loadingApprovers, loadApprovers, getApproversWithRole } = useApprovers();
  const { user } = useAuth();
  
  const [canApprove, setCanApprove] = useState<boolean | null>(null);
  const [usersWithApprove, setUsersWithApprove] = useState<string[]>([]);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const checkApprovePermission = async () => {
    setCheckingPermission(true);
    try {
      const result = await hasPermission('approve_policy_rules');
      setCanApprove(result);
    } catch (error) {
      console.error('Error checking permission:', error);
      setCanApprove(false);
    } finally {
      setCheckingPermission(false);
    }
  };
  
  const checkUsersWithApprove = async () => {
    setCheckingUsers(true);
    try {
      // This is a placeholder - the actual implementation might differ
      // based on how your authorization system is set up
      const users = approvers.filter(a => a.role === 'admin' || a.role === 'compliance_officer')
                             .map(a => a.name);
      setUsersWithApprove(users);
    } catch (error) {
      console.error('Error getting users with permission:', error);
      setUsersWithApprove([]);
    } finally {
      setCheckingUsers(false);
    }
  };
  
  useEffect(() => {
    // Get user role from the user object
    if (user && user.role) {
      setUserRole(user.role);
    }
    
    checkApprovePermission();
    checkUsersWithApprove();
  }, [user]);
  
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Permissions System Test</CardTitle>
          <CardDescription>
            Testing the simplified permissions system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">System Status</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 w-32">User Role:</span>
                    <span className="text-sm font-medium">{userRole || 'Not logged in'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Permission Check</h3>
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Can Approve Policies:</span>
                    {checkingPermission ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                    ) : canApprove === null ? (
                      <span>Not checked</span>
                    ) : canApprove ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkApprovePermission}
                    disabled={checkingPermission}
                    className="mt-2"
                  >
                    {checkingPermission ? 'Checking...' : 'Check Again'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium">Users With Approve Permission</h3>
              <div className="mt-2">
                {checkingUsers ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                    <span>Loading users...</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm">
                      Found {usersWithApprove.length} users with policy_rules.approve permission
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {usersWithApprove.join(', ')}
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkUsersWithApprove}
                  disabled={checkingUsers}
                  className="mt-2"
                >
                  {checkingUsers ? 'Loading...' : 'Refresh Users'}
                </Button>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium">Approvers from useApprovers hook</h3>
              <div className="mt-2">
                {loadingApprovers ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                    <span>Loading approvers...</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm">
                      Found {approvers.length} approvers
                    </div>
                    <div className="mt-2 space-y-1">
                      {approvers.map(approver => {
                        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${(approver.name || 'XX').substring(0, 2)}&backgroundColor=4F46E5`;
                        return (
                          <div key={approver.id} className="flex items-center space-x-2">
                            <div 
                              className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs"
                              style={{ backgroundImage: `url(${avatarUrl})` }}
                            >
                              {approver.name ? approver.name.substring(0, 2) : 'XX'}
                            </div>
                            <span className="text-sm">{approver.name || 'Unknown'} ({approver.role || 'No role'})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadApprovers}
                  disabled={loadingApprovers}
                  className="mt-2"
                >
                  {loadingApprovers ? 'Loading...' : 'Refresh Approvers'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};