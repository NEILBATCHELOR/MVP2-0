/**
 * useIssuerCrud Hook
 * 
 * Custom React hook for issuer (organization) CRUD operations and management
 */
import { useState, useCallback } from 'react';
import type { Organization, OrganizationStatus, ComplianceStatusType } from '@/types/core/centralModels';
import * as issuerService from '../services/issuerService';

interface UseIssuerCrudReturn {
  issuer: Organization | null;
  issuers: Organization[];
  loading: boolean;
  error: string | null;
  createIssuer: (issuer: Omit<Organization, 'id' | 'createdAt'>) => Promise<Organization | null>;
  getIssuer: (id: string) => Promise<Organization | null>;
  updateIssuer: (id: string, updates: Partial<Organization>) => Promise<Organization | null>;
  deleteIssuer: (id: string) => Promise<boolean>;
  listIssuers: (filters?: Partial<Organization>) => Promise<void>;
  getIssuerByName: (name: string) => Promise<Organization | null>;
  updateIssuerStatus: (id: string, status: OrganizationStatus) => Promise<Organization | null>;
  updateComplianceStatus: (id: string, status: ComplianceStatusType) => Promise<Organization | null>;
  completeOnboarding: (id: string) => Promise<Organization | null>;
  resetState: () => void;
}

export const useIssuerCrud = (): UseIssuerCrudReturn => {
  const [issuer, setIssuer] = useState<Organization | null>(null);
  const [issuers, setIssuers] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setIssuer(null);
    setIssuers([]);
    setError(null);
    setLoading(false);
  }, []);

  const createIssuer = useCallback(async (issuerData: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newIssuer = await issuerService.createIssuer(issuerData);
      if (!newIssuer) {
        setError('Failed to create issuer organization');
        return null;
      }
      
      setIssuer(newIssuer);
      return newIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error creating issuer: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getIssuer = useCallback(async (id: string): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedIssuer = await issuerService.getIssuerById(id);
      if (!fetchedIssuer) {
        setError('Issuer organization not found');
        return null;
      }
      
      setIssuer(fetchedIssuer);
      return fetchedIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching issuer: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIssuer = useCallback(async (id: string, updates: Partial<Organization>): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedIssuer = await issuerService.updateIssuer(id, updates);
      if (!updatedIssuer) {
        setError('Failed to update issuer organization');
        return null;
      }
      
      setIssuer(updatedIssuer);
      return updatedIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error updating issuer: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteIssuer = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await issuerService.deleteIssuer(id);
      if (!success) {
        setError('Failed to delete issuer organization');
        return false;
      }
      
      setIssuer(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error deleting issuer: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const listIssuers = useCallback(async (filters?: Partial<Organization>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const issuersList = await issuerService.listIssuers(filters);
      setIssuers(issuersList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error listing issuers: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const getIssuerByName = useCallback(async (name: string): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedIssuer = await issuerService.getIssuerByName(name);
      if (!fetchedIssuer) {
        setError('Issuer organization not found');
        return null;
      }
      
      setIssuer(fetchedIssuer);
      return fetchedIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching issuer by name: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIssuerStatus = useCallback(async (id: string, status: OrganizationStatus): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedIssuer = await issuerService.updateIssuerStatus(id, status);
      if (!updatedIssuer) {
        setError('Failed to update issuer status');
        return null;
      }
      
      setIssuer(updatedIssuer);
      return updatedIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error updating issuer status: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateComplianceStatus = useCallback(async (id: string, status: ComplianceStatusType): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedIssuer = await issuerService.updateIssuerComplianceStatus(id, status);
      if (!updatedIssuer) {
        setError('Failed to update compliance status');
        return null;
      }
      
      setIssuer(updatedIssuer);
      return updatedIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error updating compliance status: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async (id: string): Promise<Organization | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedIssuer = await issuerService.completeIssuerOnboarding(id);
      if (!updatedIssuer) {
        setError('Failed to complete onboarding');
        return null;
      }
      
      setIssuer(updatedIssuer);
      return updatedIssuer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error completing onboarding: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    issuer,
    issuers,
    loading,
    error,
    createIssuer,
    getIssuer,
    updateIssuer,
    deleteIssuer,
    listIssuers,
    getIssuerByName,
    updateIssuerStatus,
    updateComplianceStatus,
    completeOnboarding,
    resetState
  };
};