// Define the Investor interface locally if it's not available from InvestorGrid
export interface Investor {
  id: string;
  name: string;
  email: string;
  type: string;
  walletAddress: string;
  kycStatus: string;
  lastUpdated: string;
  company?: string;
}

export const sampleInvestors: Investor[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    type: "individual",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    kycStatus: "approved",
    lastUpdated: "2023-06-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    type: "entity",
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    kycStatus: "pending",
    lastUpdated: "2023-06-14T14:45:00Z",
  },
  {
    id: "3",
    name: "Acme Corporation",
    email: "contact@acmecorp.com",
    type: "entity",
    walletAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
    kycStatus: "not_started",
    lastUpdated: "2023-06-10T09:15:00Z",
  },
  {
    id: "4",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    type: "individual",
    walletAddress: "0xdef1234567890abcdef1234567890abcdef123456",
    kycStatus: "failed",
    lastUpdated: "2023-06-12T16:20:00Z",
  },
  {
    id: "5",
    name: "Global Investments LLC",
    email: "info@globalinvestments.com",
    type: "entity",
    walletAddress: "0x567890abcdef1234567890abcdef1234567890ab",
    kycStatus: "expired",
    lastUpdated: "2023-06-08T11:10:00Z",
  },
];
