// src/services/investor/investorTypes.ts

export interface InvestorType {
    id: string;
    name: string;
  }
  
  export interface InvestorTypeCategory {
    id: string;
    name: string;
    types: InvestorType[];
  }
  
  export const investorTypeCategories: InvestorTypeCategory[] = [
    {
      id: "institutional",
      name: "Institutional Investors",
      types: [
        { id: "pension_funds", name: "Pension Funds" },
        { id: "sovereign_wealth_funds", name: "Sovereign Wealth Funds (SWFs)" },
        { id: "insurance_companies", name: "Insurance Companies" },
        { id: "endowments_foundations", name: "Endowments & Foundations" },
        { id: "asset_managers", name: "Asset Managers & Mutual Funds" },
        { id: "hedge_funds", name: "Hedge Funds" },
        {
          id: "private_equity_vc",
          name: "Private Equity & Venture Capital Firms",
        },
        { id: "family_offices", name: "Family Offices" },
        { id: "banks_investment_firms", name: "Banks & Investment Firms" },
      ],
    },
    {
      id: "retail",
      name: "Retail Investors",
      types: [
        { id: "hnwi", name: "High-Net-Worth Individuals (HNWIs)" },
        { id: "mass_affluent", name: "Mass Affluent Investors" },
      ],
    },
    {
      id: "corporate",
      name: "Corporate & Strategic Investors",
      types: [
        { id: "corporates_conglomerates", name: "Corporates & Conglomerates" },
        { id: "private_companies", name: "Private Companies & Holdings" },
        { id: "strategic_investors", name: "Strategic Investors" },
      ],
    },
    {
      id: "government",
      name: "Government & Supranational Investors",
      types: [
        {
          id: "sovereign_wealth_funds_gov",
          name: "Sovereign Wealth Funds (SWFs)",
        },
        {
          id: "development_finance",
          name: "Development Finance Institutions (DFIs)",
        },
        { id: "government_investment", name: "Government Investment Vehicles" },
        { id: "multilateral_institutions", name: "Multilateral Institutions" },
      ],
    },
    {
      id: "alternative",
      name: "Alternative & Thematic Investors",
      types: [
        { id: "reits", name: "Real Estate Investment Trusts (REITs)" },
        { id: "infrastructure", name: "Infrastructure Investors" },
        { id: "commodities", name: "Commodities & Natural Resources Funds" },
        { id: "distressed", name: "Distressed & Special Situations Investors" },
        { id: "quantitative", name: "Quantitative & Algorithmic Investors" },
      ],
    },
    {
      id: "digital",
      name: "Tokenized & Digital Asset Investors",
      types: [
        { id: "institutional_crypto", name: "Institutional Crypto Investors" },
      ],
    },
  ];
  
  // Flat list of all investor types for validation
  export const getAllInvestorTypes = (): InvestorType[] => {
    return investorTypeCategories.flatMap((category) => category.types);
  };
  
  // Get full type name from ID
  export const getInvestorTypeName = (typeId: string): string => {
    const allTypes = getAllInvestorTypes();
    const type = allTypes.find((t) => t.id === typeId);
    return type?.name || typeId;
  };
  
  // Get category name from type ID
  export const getCategoryForType = (typeId: string): string | null => {
    for (const category of investorTypeCategories) {
      if (category.types.some((t) => t.id === typeId)) {
        return category.name;
      }
    }
    return null;
  };
  
  // Format type ID for display (convert snake_case to Title Case)
  export const formatTypeId = (typeId: string): string => {
    return typeId
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  