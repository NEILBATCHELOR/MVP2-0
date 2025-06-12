export interface Investor {
  id: string;
  name: string;
  email: string;
  company?: string;
  type: string;
  kyc_status: string;
  wallet_address?: string;
  verification_details?: any;
}
