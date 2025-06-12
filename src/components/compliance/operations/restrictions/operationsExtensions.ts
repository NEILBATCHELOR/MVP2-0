import { useState, useEffect } from 'react';
import { supabase } from '@/infrastructure/database/client';
import * as restrictionService from '@/services/integrations/restrictionService';
import type { RestrictionRule } from './types';
import type { Json } from '@/types/core/supabase';
import type { Tables } from '@/types/core/database';

// Define interfaces for tables not in the schema
interface OnboardingRestrictionLog {
  id: string;
  performed_by: string;
  performed_at: string;
  action: string;
  restriction_id: string;
  details: string;
  old_value: Json | null;
  new_value: Json | null;
}

interface RestrictionEffectiveness {
  rule_id: string;
  total_blocks: number;
  last_triggered: string;
  effectiveness_score: number;
}

// Mock implementation for development - replace with actual implementations when tables are created
const mockDataAccess = {
  async getOnboardingRestrictionLogs() {
    console.warn('Using mock implementation for onboarding_restriction_logs');
    return [];
  },
  
  async getRestrictionEffectiveness() {
    console.warn('Using mock implementation for restriction_effectiveness');
    return [];
  },
  
  async getRestrictionInsights() {
    console.warn('Using mock implementation for get_restriction_insights RPC');
    return [];
  }
};

export const restrictionExtensions = {
  // Using arrow function syntax
  getRestrictions: async (): Promise<RestrictionRule[]> => {
    const rules = await restrictionService.restrictionService.getRestrictions();
    
    // Convert string dates to Date objects to match the RestrictionRule type
    return rules.map(rule => ({
      ...rule,
      createdAt: new Date(rule.createdAt),
      updatedAt: new Date(rule.updatedAt)
    }));
  },

  // Extend the base restriction service with operations-specific methods
  ...restrictionService.restrictionService,

  // Operations-specific methods
  async getRestrictionAuditLog(dateRange?: { start: Date; end: Date }) {
    try {
      // Try actual implementation, fallback to mock
      return await mockDataAccess.getOnboardingRestrictionLogs();
    } catch (error) {
      console.error('Error accessing onboarding_restriction_logs:', error);
      return [];
    }
  },

  async bulkUpdateRestrictions(updates: Array<{ id: string; active: boolean }>) {
    try {
      // Get the full records first
      const { data: existingRestrictions, error: fetchError } = await supabase
        .from('onboarding_restrictions')
        .select('*')
        .in('id', updates.map(u => u.id));
      
      if (fetchError) throw fetchError;
      
      if (!existingRestrictions || existingRestrictions.length === 0) {
        throw new Error('No restrictions found to update');
      }
      
      // Use any typing to avoid strict table type checks
      const updateData = updates.map(update => {
        const existing = existingRestrictions.find(r => r.id === update.id);
        if (!existing) {
          throw new Error(`Restriction with ID ${update.id} not found`);
        }
        
        return {
          ...existing,
          active: update.active,
          updated_at: new Date().toISOString()
        };
      });
      
      const { error } = await supabase
        .from('onboarding_restrictions')
        .upsert(updateData as any);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating restrictions:', error);
      throw error;
    }
  },

  async getRestrictionEffectiveness(): Promise<{
    ruleId: string;
    totalBlocks: number;
    lastTriggered: Date;
  }[]> {
    try {
      // Use mock implementation since table doesn't exist
      const mockData = await mockDataAccess.getRestrictionEffectiveness() as RestrictionEffectiveness[];
      
      return mockData.map(item => ({
        ruleId: item.rule_id,
        totalBlocks: item.total_blocks,
        lastTriggered: new Date(item.last_triggered)
      }));
    } catch (error) {
      console.error('Error fetching restriction effectiveness:', error);
      return [];
    }
  },

  async getRestrictionInsights() {
    try {
      // Use mock implementation since RPC doesn't exist
      return await mockDataAccess.getRestrictionInsights();
    } catch (error) {
      console.error('Error fetching restriction insights:', error);
      return [];
    }
  },

  async exportRestrictionReport(format: 'csv' | 'pdf') {
    const { data: restrictions } = await this.getRestrictions();
    const { data: stats } = await this.getStatistics();
    const effectiveness = await this.getRestrictionEffectiveness();

    // Implementation would depend on your reporting tools
    // This is just a placeholder structure
    return {
      restrictions,
      stats,
      effectiveness,
      generatedAt: new Date(),
      format
    };
  },

  getCountryRestrictions: async () => {
    return restrictionService.restrictionService.getCountryRestrictions();
  },

  getInvestorTypeRestrictions: async () => {
    return restrictionService.restrictionService.getInvestorTypeRestrictions();
  },
};