// Token contract configuration types
export interface ERC1155DetailedConfig {
  name: string;
  description: string;
  metadata: {
    tokenTypes: Array<{
      type: "fungible" | "non-fungible";
      id?: string;
      ids?: string[];
      supply?: string;
      uri?: string;
    }>;
    isMintable: boolean;
    minterAddress: string;
    mintingLimit: string;
    isBurnable: boolean;
    burnConditions: string;
    supplyTracking: boolean;
    hasNestedTokens: boolean;
  };
}