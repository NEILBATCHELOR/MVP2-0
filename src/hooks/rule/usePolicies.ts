import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';
import { savePolicy, getPolicy, getAllPolicies, deletePolicy, Policy } from '@/services/policy/enhancedPolicyService';

/**
 * Hook for managing policies
 */
export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const userId = user?.id || 'admin-bypass';
  
  // Use a ref to track if we've already loaded policies to prevent duplicate loads
  const initialLoadCompleted = useRef(false);
  // Add a loading debounce timer ref
  const loadingTimerRef = useRef<number | null>(null);

  // Load all policies
  const loadPolicies = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[usePolicies] Loading policies...');
      const data = await getAllPolicies();
      console.log(`[usePolicies] Loaded ${data.length} policies`);
      setPolicies(data);
      initialLoadCompleted.current = true;
    } catch (err) {
      console.error('[usePolicies] Error loading policies:', err);
      setError(err instanceof Error ? err : new Error('Failed to load policies'));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Load policies on initial mount, but only once
  useEffect(() => {
    // Skip loading if we've already completed initial load
    if (initialLoadCompleted.current) {
      console.log('[usePolicies] Skipping policy load - already loaded');
      return;
    }
    
    // Clear any existing timer
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
    }
    
    // Set a short debounce to prevent rapid consecutive calls
    loadingTimerRef.current = window.setTimeout(() => {
      console.log('[usePolicies] Initial policy load');
      loadPolicies();
    }, 300);
    
    // Clean up timer on unmount
    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, [loadPolicies]);

  // Get a single policy
  const getById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await getPolicy(id);
    } catch (err) {
      console.error(`Error getting policy ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to get policy ${id}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create or update a policy
  const saveNewPolicy = useCallback(async (policy: Policy) => {
    try {
      setLoading(true);
      setError(null);
      const savedPolicy = await savePolicy(policy, userId);
      
      // Update local state
      setPolicies(prevPolicies => {
        // If the policy already exists, replace it, otherwise add it
        const exists = prevPolicies.some(p => p.id === savedPolicy.id);
        if (exists) {
          return prevPolicies.map(p => 
            p.id === savedPolicy.id ? savedPolicy : p
          );
        } else {
          return [savedPolicy, ...prevPolicies];
        }
      });
      
      return savedPolicy;
    } catch (err) {
      console.error('Error saving policy:', err);
      setError(err instanceof Error ? err : new Error('Failed to save policy'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Delete a policy
  const removePolicy = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deletePolicy(id);
      
      // Update local state
      setPolicies(prevPolicies => 
        prevPolicies.filter(policy => policy.id !== id)
      );
      
      return true;
    } catch (err) {
      console.error(`Error deleting policy ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to delete policy ${id}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    policies,
    loading,
    error,
    loadPolicies,
    getById,
    savePolicy: saveNewPolicy,
    deletePolicy: removePolicy
  };
}