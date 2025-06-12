/**
 * Standard role definitions to ensure consistency across the application
 */
export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ISSUER: 'issuer',
  COMPLIANCE_OFFICER: 'compliance_officer',
  INVESTOR: 'investor',
  USER: 'user',
} as const;

export type RoleType = typeof Roles[keyof typeof Roles];

/**
 * Role display names for UI presentation
 */
export const RoleDisplayNames: Record<RoleType, string> = {
  [Roles.SUPER_ADMIN]: 'Super Admin',
  [Roles.ADMIN]: 'Admin',
  [Roles.ISSUER]: 'Issuer',
  [Roles.COMPLIANCE_OFFICER]: 'Compliance Officer',
  [Roles.INVESTOR]: 'Investor',
  [Roles.USER]: 'User',
};