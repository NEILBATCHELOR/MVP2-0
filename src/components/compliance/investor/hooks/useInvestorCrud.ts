/**
 * useInvestorCrud Hook
 * 
 * Custom React hook for investor CRUD operations and management
 */
import { useState, useCallback } from 'react';
import type { Investor, ApprovalType } from '@/types/core/centralModels';
import { ApprovalStatus } from '@/types/core/centralModels';
import * as investorService from '../services/investorService';

interface UseInvestorCrudReturn {
  investor: Investor | null;
  investors: Investor[];
  loading: boolean;
  error: string | null;
  createInvestor: (investor: Omit<Investor, 'id' | 'createdAt'>) => Promise<Investor | null>;
  getInvestor: (id: string) => Promise<Investor | null>;
  updateInvestor: (id: string, updates: Partial<Investor>) => Promise<Investor | null>;
  deleteInvestor: (id: string) => Promise<boolean>;
  listInvestors: (filters?: Partial<Investor>) => Promise<void>;
  getInvestorByEmail: (email: string) => Promise<Investor | null>;
  submitInvestorApproval: (
    investorId: string, 
    approvalType: ApprovalType, 
    metadata?: Record<string, any>
  ) => Promise<boolean>;
  resetState: () => void;
}

export const useInvestorCrud = (): UseInvestorCrudReturn => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setInvestor(null);
    setInvestors([]);
    setError(null);
    setLoading(false);
  }, []);

  const createInvestor = useCallback(async (investorData: Omit<Investor, 'id' | 'createdAt'>): Promise<Investor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newInvestor = await investorService.createInvestor(investorData);
      if (!newInvestor) {
        setError('Failed to create investor');
        return null;
      }
      
      setInvestor(newInvestor);
      return newInvestor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error creating investor: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvestor = useCallback(async (id: string): Promise<Investor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedInvestor = await investorService.getInvestorById(id);
      if (!fetchedInvestor) {
        setError('Investor not found');
        return null;
      }
      
      setInvestor(fetchedInvestor);
      return fetchedInvestor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching investor: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvestor = useCallback(async (id: string, updates: Partial<Investor>): Promise<Investor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedInvestor = await investorService.updateInvestor(id, updates);
      if (!updatedInvestor) {
        setError('Failed to update investor');
        return null;
      }
      
      setInvestor(updatedInvestor);
      return updatedInvestor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error updating investor: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvestor = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await investorService.deleteInvestor(id);
      if (!success) {
        setError('Failed to delete investor');
        return false;
      }
      
      setInvestor(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error deleting investor: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const listInvestors = useCallback(async (filters?: Partial<Investor>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const investorsList = await investorService.listInvestors(filters);
      setInvestors(investorsList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error listing investors: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvestorByEmail = useCallback(async (email: string): Promise<Investor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedInvestor = await investorService.getInvestorByEmail(email);
      if (!fetchedInvestor) {
        setError('Investor not found');
        return null;
      }
      
      setInvestor(fetchedInvestor);
      return fetchedInvestor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching investor by email: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitInvestorApproval = useCallback(async (
    investorId: string, 
    approvalType: ApprovalType, 
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const approval = {
        investorId,
        approvalType,
        status: ApprovalStatus.PENDING,
        submissionDate: new Date().toISOString(),
        metadata: metadata || {}
      };
      
      const result = await investorService.createInvestorApproval(approval);
      if (!result) {
        setError('Failed to submit approval request');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error submitting approval: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    investor,
    investors,
    loading,
    error,
    createInvestor,
    getInvestor,
    updateInvestor,
    deleteInvestor,
    listInvestors,
    getInvestorByEmail,
    submitInvestorApproval,
    resetState
  };
};