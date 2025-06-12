import React, { Suspense, useEffect, lazy, useState } from "react";
import { Roles } from '@/utils/auth/constants';
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { getPrimaryOrFirstProject } from "@/services/project/primaryProjectService";
import Home from "./components/home";
import CapTableDashboard from "./components/captable/CapTableDashboard";
import InvestorsList from "./components/investors/InvestorsList";
import ReportsDashboard from "./components/reports/ReportsDashboard";
import MainLayout from "./components/layout/MainLayout";
import CapTableManagerNew from "./components/captable/CapTableManagerNew";
import FactoringManager from "./components/factoring/FactoringManager";
import RuleManagementDashboard from "./components/rules/RuleManagementDashboard";
import PolicyTemplateDashboard from "./components/rules/PolicyTemplateDashboard";
import PolicyTemplateVersionManagement from "./components/rules/PolicyTemplateVersionManagement";
import RoleManagementDashboard from "./components/UserManagement/dashboard/RoleManagementDashboard";
import RedemptionDashboard from "./components/redemption/dashboard/RedemptionDashboard";
import { OperationsRedemptionPage } from "./pages/redemption";
import ActivityMonitorPage from "./pages/ActivityMonitorPage";
import PasswordResetPage from "./components/auth/pages/PasswordResetPage";
import MFALoginPage from "./components/auth/pages/MFALoginPage";
import UserMFAControls from "./components/UserManagement/security/UserMFAControls";
import ActivityMetricsPage from "./pages/ActivityMetricsPage";
import EnhancedApprovalDashboard from "./components/rules/EnhancedApprovalDashboard";
import ProjectDetailsPage from "./components/projects/ProjectDetailsPage";
import ProjectDetail from "./components/projects/ProjectDetail";
import OfferingsPageWrapper from "./pages/OfferingsPage";

// Token Pages
import TokenDashboardPage from "./components/tokens/pages/TokenDashboardPage";
import TokenEditPage from "./components/tokens/pages/TokenEditPage";
import TokenDeployPageEnhanced from "./components/tokens/pages/TokenDeployPageEnhanced";
import TokenEventsPage from "./components/tokens/pages/TokenEventsPage";
import TokenAnalyticsPage from "./components/tokens/pages/TokenAnalyticsPage";
// Legacy import kept for reference
// import TokenDeployPage from "./components/tokens/pages/TokenDeployPage";
import TokenMintPage from "./components/tokens/pages/TokenMintPage";
import CreateTokenPage from "./components/tokens/pages/CreateTokenPage";
import TokenSelectionPage from "./components/tokens/pages/TokenSelectionPage";
import { TokenTestingPage } from "./components/tokens/testing";

// Wallet Pages
import NewWalletPage from "./pages/wallet/NewWalletPage";
import WalletDashboardPage from "./pages/wallet/WalletDashboardPage";
import TransferPage from "./pages/wallet/TransferPage";
import SwapPage from "./pages/wallet/SwapPage";
import WalletDemoPage from "./pages/WalletDemoPage";

// Enhanced Wallet Pages (Production-Ready with Real Blockchain Integration)
import EnhancedWalletDashboardPage from "./pages/wallet/EnhancedWalletDashboardPage";
import EnhancedTransferPage from "./pages/wallet/EnhancedTransferPage";
import EnhancedSwapPage from "./pages/wallet/EnhancedSwapPage";
import RipplePaymentsPage from "./pages/wallet/RipplePaymentsPage";
import MoonpayPage from "./pages/wallet/MoonpayPage";
import TransactionHistoryPage from "./pages/wallet/TransactionHistoryPage";
import GuardianTestPageRedesigned from "./pages/wallet/GuardianTestPageRedesigned";

// DFNS Components
import { DfnsWalletDashboard } from "./components/dfns";

// Investor Portal Pages
import ProfilePage from "./components/compliance/portal/ProfilePage";
import DocumentsPage from "./components/compliance/portal/DocumentsPage";

// ✅ Import Onboarding Components
import WelcomeScreen from "@/components/onboarding/WelcomeScreen";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import OnboardingHome from "@/components/onboarding/OnboardingHome"; // Ensure this exists!
// Import provider
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import InvestorOnboardingFlow from "@/components/investors/InvestorOnboardingFlow";
import InvestorOnboarding from "@/components/compliance/investor/InvestorOnboarding";

// Import Compliance Components
import IssuerOnboarding from "@/components/compliance/operations/issuer/IssuerOnboarding";
import KYCAMLChecks from "@/components/compliance/operations/kyc/KYCAMLChecks";
import DocumentManagement from "@/components/compliance/operations/documents/DocumentManagement";
import RiskAssessment from "@/components/compliance/operations/risk/RiskAssessment";
import { ComplianceMonitoring } from "@/components/compliance/operations/shared/monitoring/ComplianceMonitoring";
import { ComplianceReporting } from "@/components/compliance/operations/shared/reporting/ComplianceReporting";
import { AuditTrail } from "@/components/compliance/operations/shared/audit/AuditTrail";
import RestrictionManager from "@/components/compliance/operations/restrictions/RestrictionManager";
import { WalletOperationsPage } from "@/components/compliance/operations/investor/pages";
import { ComplianceDashboard } from "@/components/compliance/operations";

// Import Auth Components
import UnauthorizedPage from "@/components/auth/UnauthorizedPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Import Notification Provider
import { NotificationProvider } from "@/infrastructure/utils/helpers/NotificationContext";

// AppKit imports removed - will be used selectively per component
// import ConditionalAppKitProvider from "@/infrastructure/blockchain/web3/appkit/ConditionalAppKitProvider";

// Add this import
const IssuerOnboardingFlow = lazy(() => import('./components/compliance/issuer/onboarding/IssuerOnboardingFlow'));

// Redirect component for token routes
const TokenRedirect = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (projectId && projectId !== "undefined") {
      // If projectId is provided and valid, redirect to project tokens
      navigate(`/projects/${projectId}/tokens`, { replace: true });
    } else {
      // Otherwise, find the primary project
      findPrimaryProject();
    }
  }, [projectId, navigate]);

  // Function to find and navigate to the primary project
  const findPrimaryProject = async () => {
    try {
      setIsLoading(true);
      
      // Use the primaryProjectService to get the primary or first project
      const project = await getPrimaryOrFirstProject();
      
      if (project) {
        // If a project is found, navigate to it
        console.log(`Found project: ${project.name} (${project.id}), redirecting...`);
        navigate(`/projects/${project.id}/tokens`, { replace: true });
      } else {
        // No projects at all, redirect to projects page
        console.warn("No projects found, redirecting to projects page");
        navigate('/projects');
      }
    } catch (error: any) {
      console.error("Error finding primary project:", error);
      toast({
        title: "Error",
        description: "Failed to find a default project. Redirecting to projects page.",
        variant: "destructive",
      });
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="text-center">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <RefreshCw className="h-6 w-6 animate-spin mb-4" />
            <span>Finding default project...</span>
          </div>
        ) : (
          <span>Redirecting...</span>
        )}
      </div>
    </div>
  );
};

/**
 * Main App component with routing configuration
 */
function App() {
  useEffect(() => {
    // Initialize any required app state
  }, []);

  return (
    <NotificationProvider>
      <OnboardingProvider>
        <Suspense fallback={<div>Loading...</div>}>
        <Routes>
            {/* Default route redirects to welcome screen */}
            <Route path="/" element={<WelcomeScreen />} />
            <Route index element={<WelcomeScreen />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />

            {/* Add redirect for tokens/:projectId to projects/:projectId/tokens */}
            <Route path="/tokens/:projectId" element={<TokenRedirect />} />

            {/* Onboarding Routes */}
            <Route path="/onboarding/*" element={<OnboardingFlow />} />
            <Route path="/onboarding/home" element={<OnboardingHome />} />

            {/* Investor onboarding */}
            <Route path="/investor/*" element={<InvestorOnboardingFlow />} />
            
            {/* Main Layout - Ensures Sidebar Renders Only Once */}
            <Route element={<MainLayout />}>
              <Route path="dashboard" element={<CapTableDashboard />} />
              <Route path="projects" element={<Home />} />
              <Route path="offerings" element={<OfferingsPageWrapper />} />
              <Route path="activity" element={<ActivityMonitorPage />} />
              <Route path="activity/metrics" element={<ActivityMetricsPage />} />
              <Route path="activity/metrics/:projectId" element={<ActivityMetricsPage />} />

              {/* Global Token Routes */}
              <Route path="tokens" element={<TokenDashboardPage />} />
              <Route path="tokens/create" element={<CreateTokenPage />} />
              <Route path="tokens/test" element={<TokenTestingPage />} />

              {/* Investor Portal Routes */}
              <Route path="compliance/portal/profile" element={<ProfilePage />} />
              <Route path="compliance/portal/documents" element={<DocumentsPage />} />

              {/* Project Routes */}
              <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
              <Route path="projects/:projectId/documents" element={<Navigate to="../?tab=issuer-documents" replace />} />
              
              {/* Project-specific Token Routes with TokenRouteLayout */}
              <Route path="projects/:projectId/tokens" element={<TokenDashboardPage />}/>
              <Route path="create" element={<CreateTokenPage />} />
              <Route path=":tokenId/deploy" element={<TokenDeployPageEnhanced />} />
              <Route path=":tokenId/mint" element={<TokenMintPage />} />

              {/* Wallet Routes */}
              <Route path="wallet/new" element={<NewWalletPage />} />
              <Route path="wallet/dashboard" element={<WalletDashboardPage />} />
              <Route path="wallet/transfer" element={<TransferPage />} />
              <Route path="wallet/swap" element={<SwapPage />} />
              <Route path="wallet/demo" element={<WalletDemoPage />} />
              
              {/* Enhanced Wallet Routes (Production-Ready) */}
              <Route path="wallet/enhanced" element={<EnhancedWalletDashboardPage />} />
              <Route path="wallet/enhanced/transfer" element={<EnhancedTransferPage />} />
              <Route path="wallet/enhanced/swap" element={<EnhancedSwapPage />} />
              <Route path="wallet/enhanced/ripple" element={<RipplePaymentsPage />} />
              <Route path="wallet/enhanced/moonpay" element={<MoonpayPage />} />
              <Route path="wallet/enhanced/history" element={<TransactionHistoryPage />} />
              
              {/* Guardian Wallet Routes */}
              <Route path="wallet/guardian/test" element={<GuardianTestPageRedesigned />} />
              
              {/* DFNS Wallet Routes */}
              <Route path="wallet/dfns" element={<DfnsWalletDashboard />} />
              <Route path="wallet/dfns/dashboard" element={<DfnsWalletDashboard />} />
              
              {/* Production Wallet Routes (Default to Dashboard) */}
              <Route path="wallet" element={<WalletDashboardPage />} />

              {/* Cap Table Routes */}
              <Route path="captable" element={<CapTableManagerNew section="overview" />} />
              <Route path="captable/investors" element={<CapTableManagerNew section="investors" />} />
              <Route path="captable/subscriptions" element={<CapTableManagerNew section="subscriptions" />} />
              <Route path="captable/allocations" element={<CapTableManagerNew section="allocations" />} />
              <Route path="captable/distributions" element={<CapTableManagerNew section="distributions" />} />
              <Route path="captable/compliance" element={<CapTableManagerNew section="compliance" />} />
              <Route path="captable/reports" element={<CapTableManagerNew section="reports" />} />
              <Route path="captable/documents" element={<CapTableManagerNew section="documents" />} />
              <Route path="captable/minting" element={<CapTableManagerNew section="minting" />} />

              {/* Token Management */}
              <Route path="tokens" element={<TokenDashboardPage />} />
              <Route path="tokens/create" element={<CreateTokenPage />} />
              <Route path="tokens/:tokenId/edit" element={<TokenEditPage />} />
              <Route path="tokens/:tokenId/deploy" element={<TokenDeployPageEnhanced />} />
              <Route path="tokens/:tokenId/mint" element={<TokenMintPage />} />

              {/* Project-specific Token Routes */}
              <Route path="projects/:projectId/tokens" element={<TokenDashboardPage />}/>
              <Route path="projects/:projectId/tokens/create" element={<CreateTokenPage />} />
              <Route path="projects/:projectId/tokens/test" element={<TokenTestingPage />} />
              <Route path="projects/:projectId/tokens/select/details" element={<TokenSelectionPage actionType="details" />} />
              <Route path="projects/:projectId/tokens/select/deploy" element={<TokenSelectionPage actionType="deploy" />} />
              <Route path="projects/:projectId/tokens/select/mint" element={<TokenSelectionPage actionType="mint" />} />
              <Route path="projects/:projectId/tokens/:tokenId/deploy" element={<TokenDeployPageEnhanced />} />
              <Route path="projects/:projectId/tokens/:tokenId/events" element={<TokenEventsPage />} />
              <Route path="projects/:projectId/tokens/:tokenId/analytics" element={<TokenAnalyticsPage />} />
              <Route path="projects/:projectId/tokens/:tokenId/mint" element={<TokenMintPage />} />

              {/* Factoring Routes */}
              <Route path="factoring/" element={<FactoringManager/>} />
              <Route path="factoring/dashboard" element={<FactoringManager section="dashboard" />} />
              <Route path="factoring/invoices" element={<FactoringManager section="invoices" />} />
              <Route path="factoring/pools" element={<FactoringManager section="pools" />} />
              <Route path="factoring/tokenization" element={<FactoringManager section="tokenization" />} />
              <Route path="factoring/distribution" element={<FactoringManager section="distribution" />} />

              {/* Project-specific Factoring Routes */}
              <Route path="/projects/:projectId/factoring/" element={<FactoringManager/>} />
              <Route path="/projects/:projectId/factoring/dashboard" element={<FactoringManager section="dashboard" />} />
              <Route path="/projects/:projectId/factoring/invoices" element={<FactoringManager section="invoices" />} />
              <Route path="/projects/:projectId/factoring/pools" element={<FactoringManager section="pools" />} />
              <Route path="/projects/:projectId/factoring/tokenization" element={<FactoringManager section="tokenization" />} />
              <Route path="/projects/:projectId/factoring/distribution" element={<FactoringManager section="distribution" />} />

              {/* Project-specific Cap Table Routes */}
              <Route path="/projects/:projectId/captable" element={<CapTableManagerNew />} />
              <Route path="/projects/:projectId/captable/investors" element={<CapTableManagerNew section="investors" />} />
              <Route path="/projects/:projectId/captable/subscriptions" element={<CapTableManagerNew section="subscriptions" />} />
              <Route path="/projects/:projectId/captable/allocations" element={<CapTableManagerNew section="allocations" />} />
              <Route path="/projects/:projectId/captable/distributions" element={<CapTableManagerNew section="distributions" />} />
              <Route path="/projects/:projectId/captable/minting" element={<CapTableManagerNew section="minting" />} />

              {/* Management and Reporting Routes */}
              <Route path="rule-management" element={<RuleManagementDashboard />} />
              <Route path="role-management" element={<RoleManagementDashboard />} />
              <Route path="mfa-settings" element={<MFALoginPage />} />
              <Route path="account/security" element={
                <UserMFAControls 
                  userId="current-user" 
                  userName="Current User" 
                  mfaEnabled={false}
                />
              } />
              <Route path="redemption" element={<RedemptionDashboard />} />
              <Route path="redemption/operations" element={<OperationsRedemptionPage />} />
              <Route path="investors" element={<InvestorsList />} />
              <Route path="reports" element={<ReportsDashboard />} />
              
              {/* Policy Template Routes */}
              <Route path="templates" element={<PolicyTemplateDashboard />} />
              <Route path="templates/:templateId" element={<PolicyTemplateVersionManagement />} />
              <Route path="templates/:templateId/versions" element={<PolicyTemplateVersionManagement />} />
              
              {/* Compliance Routes - Moved inside MainLayout */}
              <Route path="compliance/investor-onboarding/*" element={<InvestorOnboarding />} />
              <Route path="compliance/issuer-onboarding" element={<IssuerOnboarding />} />
              <Route path="compliance/operations/dashboard" element={<ComplianceDashboard />} />
              <Route path="compliance/kyc-aml" element={<KYCAMLChecks />} />
              <Route path="compliance/documents" element={<DocumentManagement />} />
              <Route path="compliance/risk" element={<RiskAssessment />} />
              <Route path="compliance/monitoring" element={<ComplianceMonitoring onAlertStatusChange={async (alertId, status) => {
                console.log(`Alert ${alertId} status changed to ${status}`);
                // TODO: Implement alert status change handler
              }} onError={(error) => {
                console.error('Monitoring error:', error);
                // TODO: Implement error handling
              }} />} />
              <Route path="compliance/audit" element={<AuditTrail onError={(error) => {
                console.error('Audit trail error:', error);
                // TODO: Implement error handling
              }} />} />
              <Route path="compliance/reports" element={<ComplianceReporting 
                onGenerateReport={async (type, startDate, endDate) => {
                  console.log(`Generating ${type} report from ${startDate} to ${endDate}`);
                  // TODO: Implement report generation
                }}
                onDownloadReport={async (reportId) => {
                  console.log(`Downloading report ${reportId}`);
                  // TODO: Implement report download
                }}
                onError={(error) => {
                  console.error('Reporting error:', error);
                  // TODO: Implement error handling
                }}
              />} />
              <Route path="compliance/rules" element={<RuleManagementDashboard />} />
              <Route path="compliance/restrictions" element={<RestrictionManager />} />
              <Route path="compliance/operations/investor/wallets" element={<WalletOperationsPage />} />
              
              {/* Issuer Onboarding */}
              <Route path="compliance/issuer/onboarding/*" element={<IssuerOnboardingFlow />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={
              <div style={{padding: "2rem", textAlign: "center"}}>
                <h1>Page Not Found</h1>
                <p>The route {window.location.pathname} doesn't exist.</p>
                <div style={{marginTop: "2rem"}}>
                  <a href="/" style={{color: "blue", textDecoration: "underline"}}>Go Home</a>
                </div>
              </div>
            } />
            </Routes>
          </Suspense>
        </OnboardingProvider>
      </NotificationProvider>
  );
}

export default App;
