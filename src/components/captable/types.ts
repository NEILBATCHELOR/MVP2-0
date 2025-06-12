import { TokenAllocation } from '@/types/core/centralModels';

export interface ExtendedTokenAllocation extends TokenAllocation {
  id: string;
  investorName: string;
  investorEmail?: string;
  tokenType: string;
  allocatedAmount: number;
  subscribedAmount: number;
  walletAddress?: string;
  allocationConfirmed: boolean;
}
