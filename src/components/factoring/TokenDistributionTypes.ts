// TokenDistributionTypes.ts
import { FactoringToken, TokenAllocation as BaseTokenAllocation } from "./types";

// Extend the TokenAllocation type to include tokenDetails
export interface TokenAllocation extends BaseTokenAllocation {
  tokenDetails?: {
    discount_rate?: number;
    investment_amount?: number;
    face_value?: number;
    name?: string;
    symbol?: string;
    value?: number;
  };
}

export interface Investor {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  count?: number;
}