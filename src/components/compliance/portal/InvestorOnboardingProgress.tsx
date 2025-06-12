import React, { useState, useEffect } from "react";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Investor, InvestorDocument, KycStatus } from "@/types/core/centralModels";
import { mapInvestorFromDatabase } from "@/utils/shared/formatting/typeMappers";
import OnboardingProgressSection from "./components/OnboardingProgressSection";
import ApprovalStatusSection from "./components/ApprovalStatusSection";
import UpcomingTasksSection from "./components/UpcomingTasksSection";
import ComplianceStatusSection from "./components/ComplianceStatusSection";
import WalletConfigurationSection from "./components/WalletConfigurationSection";
import ProfileSettingsSection from "./components/ProfileSettingsSection";

// Helper function that wraps Supabase calls without generic typing to avoid deep type instantiation
const safeSupabaseQuery = {
  async getInvestor(userId: string | undefined) {
    if (!userId) return null;
    
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const result = await supabase
      .from("investors")
      .select("*")
      .eq("user_id", userId)
      .single();
      
    return { data: result.data, error: result.error };
  },
  
  async getDocuments(entityId: string) {
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const result = await supabase
      .from("documents")
      .select("*")
      .eq("entity_id", entityId)
      .eq("entity_type", "investor");
      
    return { data: result.data, error: result.error };
  }
};

const InvestorOnboardingProgress: React.FC = () => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [documents, setDocuments] = useState<InvestorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("progress");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchInvestorData();
    }
  }, [user?.id]);

  const fetchInvestorData = async () => {
    setIsLoading(true);
    try {
      // Using our safe wrapper function
      const { data: investorData, error: investorError } = await safeSupabaseQuery.getInvestor(user?.id);

      if (investorError) {
        throw investorError;
      }

      if (!investorData) {
        throw new Error("No investor data found");
      }

      // Using our safe wrapper function
      const { data: documentData, error: documentError } = await safeSupabaseQuery.getDocuments(investorData.investor_id);

      if (documentError) {
        throw documentError;
      }

      const mappedInvestor = mapInvestorFromDatabase(investorData);
      
      // Transform document data
      const mappedDocuments = documentData.map((doc) => ({
        id: doc.id,
        investorId: doc.entity_id,
        name: doc.name,
        description: doc.metadata && typeof doc.metadata === 'object' && 'description' in doc.metadata ? 
          doc.metadata.description as string : undefined,
        documentUrl: doc.file_url,
        documentType: doc.type,
        status: doc.status,
        rejectionReason: doc.metadata && typeof doc.metadata === 'object' && 'rejection_reason' in doc.metadata ? 
          doc.metadata.rejection_reason as string : undefined,
        reviewedBy: doc.metadata && typeof doc.metadata === 'object' && 'reviewed_by' in doc.metadata ? 
          doc.metadata.reviewed_by as string : undefined,
        reviewedAt: doc.metadata && typeof doc.metadata === 'object' && 'reviewed_at' in doc.metadata ? 
          new Date(doc.metadata.reviewed_at as string) : undefined,
        expiresAt: doc.expiry_date ? new Date(doc.expiry_date) : undefined,
        metadata: doc.metadata,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at)
      })) as InvestorDocument[];

      setInvestor(mappedInvestor);
      setDocuments(mappedDocuments);
    } catch (error) {
      console.error("Error fetching investor data:", error);
      toast({
        title: "Error",
        description: "Failed to load your investor profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate onboarding progress
  const calculateProgress = () => {
    if (!investor) return 0;
    
    let completedSteps = 0;
    let totalSteps = 4; // Registration, Verification, KYC/AML, Wallet Setup
    
    // Registration is always completed if we have investor data
    completedSteps++;
    
    // Check verification status
    if (investor.kycVerifiedAt) completedSteps++;
    
    // Check KYC/AML status
    if (investor.kycStatus === KycStatus.APPROVED) completedSteps++;
    
    // Check wallet setup
    if (investor.walletAddress) completedSteps++;
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No investor profile found</h3>
        <p className="text-muted-foreground">
          Please complete your registration to continue.
        </p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="progress">Onboarding Progress</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OnboardingProgressSection 
              investor={investor} 
              progress={progress} 
            />
            <ApprovalStatusSection 
              investor={investor} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UpcomingTasksSection 
              investor={investor} 
              documents={documents} 
              onRefresh={fetchInvestorData}
            />
            <ComplianceStatusSection 
              investor={investor} 
              documents={documents} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="profile">
          <ProfileSettingsSection 
            investor={investor} 
            documents={documents} 
            onUpdate={fetchInvestorData}
          />
        </TabsContent>
        
        <TabsContent value="wallet">
          <WalletConfigurationSection 
            investor={investor} 
            onUpdate={fetchInvestorData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorOnboardingProgress; 