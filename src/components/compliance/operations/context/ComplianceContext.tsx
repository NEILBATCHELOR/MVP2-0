import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ComplianceRule, DocumentRequirement, RiskLevel } from '../types';

interface ComplianceContextType {
  rules: ComplianceRule[];
  addRule: (rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<ComplianceRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  getActiveRules: () => ComplianceRule[];
  isCountryBlocked: (countryId: string) => boolean;
  isInvestorTypeBlocked: (typeId: string) => boolean;
  getRequiredDocuments: (investorTypeId: string) => DocumentRequirement[];
  getRiskLevel: (factors: Record<string, number>) => RiskLevel;
}

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rules, setRules] = useState<ComplianceRule[]>([]);

  const addRule = useCallback(async (rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRule: ComplianceRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRules(prev => [...prev, newRule]);
    // TODO: Sync with backend
  }, []);

  const updateRule = useCallback(async (id: string, updates: Partial<ComplianceRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === id 
        ? { ...rule, ...updates, updatedAt: new Date() }
        : rule
    ));
    // TODO: Sync with backend
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
    // TODO: Sync with backend
  }, []);

  const getActiveRules = useCallback(() => {
    return rules.filter(rule => rule.enabled);
  }, [rules]);

  const isCountryBlocked = useCallback((countryId: string) => {
    return getActiveRules().some(rule => rule.blockedCountries.includes(countryId));
  }, [getActiveRules]);

  const isInvestorTypeBlocked = useCallback((typeId: string) => {
    return getActiveRules().some(rule => rule.blockedInvestorTypes.includes(typeId));
  }, [getActiveRules]);

  const getRequiredDocuments = useCallback((investorTypeId: string) => {
    const applicableRules = getActiveRules().filter(rule => 
      !rule.blockedInvestorTypes.includes(investorTypeId)
    );

    const requiredDocs = new Map<string, DocumentRequirement>();
    
    applicableRules.forEach(rule => {
      rule.requiredDocuments.forEach(doc => {
        if (!requiredDocs.has(doc.id) || doc.required) {
          requiredDocs.set(doc.id, doc);
        }
      });
    });

    return Array.from(requiredDocs.values());
  }, [getActiveRules]);

  const getRiskLevel = useCallback((factors: Record<string, number>): RiskLevel => {
    const score = Object.values(factors).reduce((sum, value) => sum + value, 0);
    
    if (score >= 75) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }, []);

  const value = {
    rules,
    addRule,
    updateRule,
    deleteRule,
    getActiveRules,
    isCountryBlocked,
    isInvestorTypeBlocked,
    getRequiredDocuments,
    getRiskLevel,
  };

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
};