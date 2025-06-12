/**
 * DeploymentService - Import alias for backward compatibility
 * 
 * This file re-exports the DeploymentService from the correct location
 * to maintain compatibility with imports that expect it in this path.
 */

export * from '@/services/deployment/DeploymentService'
export { DeploymentService as default } from '@/services/deployment/DeploymentService'
