import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Investor, InvestorDocument, KycStatus } from "@/types/core/centralModels";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";

interface UpcomingTasksSectionProps {
  investor: Investor;
  documents: InvestorDocument[];
  onRefresh: () => void;
}

const UpcomingTasksSection: React.FC<UpcomingTasksSectionProps> = ({
  investor,
  documents,
  onRefresh,
}) => {
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = (taskId: string) => {
    // Set the current task being uploaded to manage UI state
    setIsUploading(taskId);
    
    // Trigger file input click for document upload
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !isUploading) {
      setIsUploading(null);
      return;
    }

    const file = files[0];
    try {
      let documentType = "";
      
      // Determine document type based on task
      if (isUploading === "kyc") {
        documentType = "government_id";
      } else if (isUploading === "wallet") {
        documentType = "wallet_confirmation";
      } else if (isUploading === "tax") {
        documentType = "tax_document";
      }

      // Upload file to storage
      const fileName = `${investor.id}/${documentType}/${Math.random().toString(36).substring(2)}_${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from("investor-documents")
        .upload(fileName, file);

      if (fileError) throw fileError;

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from("investor-documents")
        .getPublicUrl(fileName);

      // Insert document record
      const { error: docError } = await supabase.from("documents").insert({
        name: file.name,
        type: documentType,
        status: "pending",
        file_path: fileName,
        file_url: urlData.publicUrl,
        entity_id: investor.id,
        entity_type: "investor",
        metadata: {
          original_name: file.name,
          size: file.size,
          content_type: file.type,
          description: `Uploaded document for ${documentType}`,
        },
      });

      if (docError) throw docError;

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending review.",
      });

      // Refresh data
      onRefresh();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Determine if KYC verification is needed
  const needsKyc = investor.kycStatus !== KycStatus.APPROVED;
  
  // Determine if wallet setup is needed
  const needsWallet = !investor.walletAddress;
  
  // Determine if tax forms are needed
  const hasTaxDocuments = documents.some(d => d.documentType.includes("tax"));
  const needsTaxForms = !hasTaxDocuments;

  // Determine if any investment opportunities are available
  const hasInvestmentOpportunities = false; // This would need to be fetched from the backend

  // Only show tasks that are needed
  const tasks = [
    ...(needsKyc ? [{
      id: "kyc",
      title: "Complete KYC Verification",
      description: "Your KYC documents are being reviewed",
      status: investor.kycStatus === KycStatus.PENDING ? "In Progress" : "Pending",
      dueDate: null,
      actionRequired: false,
    }] : []),
    ...(needsWallet ? [{
      id: "wallet",
      title: "Set Up Wallet Connection",
      description: "Connect your wallet to receive investments",
      status: "Pending",
      dueDate: null,
      actionRequired: false,
    }] : []),
    ...(hasInvestmentOpportunities ? [{
      id: "investments",
      title: "Review Investment Opportunities",
      description: "Browse available investment opportunities",
      status: "Pending",
      dueDate: null,
      actionRequired: false,
    }] : []),
    ...(needsTaxForms ? [{
      id: "tax",
      title: "Complete Tax Forms",
      description: "Submit required tax documentation",
      status: "Action Required",
      dueDate: "2023-07-20",
      actionRequired: true,
    }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tasks that require your attention
        </p>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No pending tasks</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hidden file input for document uploads */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start justify-between border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {task.actionRequired ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-red-500">
                        Due by: {task.dueDate}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === "In Progress" 
                      ? "bg-blue-100 text-blue-800" 
                      : task.status === "Action Required" 
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
                  }`}>
                    {task.status}
                  </span>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (task.id === "kyc" || task.id === "tax" || task.id === "wallet") {
                        handleUploadClick(task.id);
                      }
                    }}
                    disabled={isUploading === task.id}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingTasksSection; 