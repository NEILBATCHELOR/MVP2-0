// TokenDistributionUtils.ts
import { FactoringToken } from "./types";
import { TokenAllocation } from "./TokenDistributionHooks";
import { 
  formatTokenType,
  getTokenTypeTheme,
  extractStandard,
  generateUUID
} from "@/utils/shared/tokenThemeUtils";

// Calculate token amount based on investment amount and discount rate
export const calculateTokenAmount = (investmentAmount: number, discountRate: number): number => {
  if (investmentAmount <= 0 || discountRate <= 0) return 0;
  
  // Formula: Investment Amount / (1 - Discount Rate)
  const faceValue = investmentAmount / (1 - discountRate / 100);
  return Math.floor(faceValue);
};

// Calculate investment amount based on token amount and discount rate
export const calculateInvestmentAmount = (tokenAmount: number, discountRate: number): number => {
  if (tokenAmount <= 0 || discountRate <= 0) return 0;
  
  // Formula: Token Amount * (1 - Discount Rate)
  return tokenAmount * (1 - discountRate / 100);
};

// Calculate token allocation statistics
export const calculateTokenStats = (
  tokenId: string, 
  allocations: TokenAllocation[], 
  tokens: FactoringToken[]
) => {
  const tokenAllocations = allocations.filter(a => a.tokenId === tokenId);
  const totalAllocated = tokenAllocations.reduce((sum, a) => sum + a.tokenAmount, 0);
  const token = tokens.find(t => t.id === tokenId);
  const totalTokens = token?.totalTokens || 0;
  const allocationPercentage = totalTokens > 0 ? (totalAllocated / totalTokens) * 100 : 0;
  
  return {
    totalAllocated,
    remainingTokens: totalTokens - totalAllocated,
    allocationPercentage: Math.min(allocationPercentage, 100),
  };
};

// Format currency for display
export const formatCurrency = (amount: number, minimumFractionDigits = 2, maximumFractionDigits = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};