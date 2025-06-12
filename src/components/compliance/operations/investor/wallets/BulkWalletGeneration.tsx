import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { WalletGeneratorFactory } from "@/services/wallet/generators/WalletGeneratorFactory";
import { ETHWalletGenerator } from "@/services/wallet/generators/ETHWalletGenerator";
import { supabase } from "@/infrastructure/database/client";

// Define custom type since it's not exported from database.ts
interface InvestorWithoutWallet {
  investor_id: string;
  name: string;
  email: string;
  type: string;
  kyc_status: string;
  company: string | null;
  wallet_address?: null; // Make this optional to fit the query result
}

export function BulkWalletGeneration() {
  const { toast } = useToast();
  const [investors, setInvestors] = useState<InvestorWithoutWallet[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [walletCreationStatus, setWalletCreationStatus] = useState<{
    processing: boolean;
    total: number;
    completed: number;
  }>({ processing: false, total: 0, completed: 0 });

  // Load investors without wallet addresses
  useEffect(() => {
    const fetchInvestorsWithoutWallets = async () => {
      setInvestorsLoading(true);
      try {
        const { data, error } = await supabase
          .from('investors')
          .select('investor_id, name, email, type, kyc_status, company')
          .is('wallet_address', null)
          .order('name');

        if (error) throw error;
        setInvestors(data || []);
      } catch (error) {
        console.error("Error fetching investors:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load investors. Please try again.",
        });
      } finally {
        setInvestorsLoading(false);
      }
    };

    fetchInvestorsWithoutWallets();
  }, [toast]);

  // Handle selecting all investors
  const handleSelectAllInvestors = () => {
    if (selectedInvestors.length === investors.length) {
      setSelectedInvestors([]);
    } else {
      setSelectedInvestors(investors.map(investor => investor.investor_id));
    }
  };

  // Handle selecting a single investor
  const handleSelectInvestor = (investorId: string) => {
    if (selectedInvestors.includes(investorId)) {
      setSelectedInvestors(selectedInvestors.filter(id => id !== investorId));
    } else {
      setSelectedInvestors([...selectedInvestors, investorId]);
    }
  };

  // Generate wallets for selected investors
  const handleBulkWalletGeneration = async () => {
    if (selectedInvestors.length === 0) {
      toast({
        variant: "destructive",
        title: "No investors selected",
        description: "Please select at least one investor to generate wallets.",
      });
      return;
    }

    setWalletCreationStatus({
      processing: true,
      total: selectedInvestors.length,
      completed: 0
    });
    
    const updatedInvestors = [];

    for (const investorId of selectedInvestors) {
      try {
        // Generate a real Ethereum wallet using the consistent ETHWalletGenerator service
        const wallet = ETHWalletGenerator.generateWallet({ 
          includePrivateKey: true, 
          includeMnemonic: false 
        });
        
        // Update the investor record in the database
        const { error } = await supabase
          .from('investors')
          .update({ 
            wallet_address: wallet.address,
            updated_at: new Date().toISOString()
          })
          .eq('investor_id', investorId);

        if (error) throw error;
        updatedInvestors.push({
          investorId,
          address: wallet.address,
          privateKey: wallet.privateKey,
        });
        
        // Update status
        setWalletCreationStatus(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      } catch (error) {
        console.error(`Error creating wallet for investor ${investorId}:`, error);
      }
    }

    // Save wallet backup data
    if (updatedInvestors.length > 0) {
      const backupData = JSON.stringify(updatedInvestors, null, 2);
      const blob = new Blob([backupData], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `investor-wallets-backup-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: "Wallets Generated Successfully",
        description: `Created ${updatedInvestors.length} Ethereum wallets. Backup file downloaded.`,
      });
    }

    // Refresh the investor list
    const { data } = await supabase
      .from('investors')
      .select('investor_id, name, email, type, kyc_status, company')
      .is('wallet_address', null)
      .order('name');
    
    setInvestors(data || []);
    setSelectedInvestors([]);
    setWalletCreationStatus({ processing: false, total: 0, completed: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Investors Without Wallets
        </h3>
        <div className="space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllInvestors}
            disabled={investorsLoading || walletCreationStatus.processing}
          >
            {selectedInvestors.length === investors.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button
            size="sm"
            onClick={handleBulkWalletGeneration}
            disabled={
              selectedInvestors.length === 0 ||
              investorsLoading ||
              walletCreationStatus.processing
            }
          >
            Generate Wallets for Selected
          </Button>
        </div>
      </div>

      {walletCreationStatus.processing && (
        <div className="bg-blue-50 p-4 rounded-md text-blue-700 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Generating wallets...</div>
            <div>
              {walletCreationStatus.completed} / {walletCreationStatus.total}
            </div>
          </div>
          <Progress 
            value={(walletCreationStatus.completed / walletCreationStatus.total) * 100} 
            className="h-2"
          />
        </div>
      )}

      <div className="border rounded-md">
        {investorsLoading ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
            <p>Loading investors...</p>
          </div>
        ) : investors.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              No investors found without wallet addresses
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedInvestors.length === investors.length &&
                        investors.length > 0
                      }
                      onCheckedChange={handleSelectAllInvestors}
                      disabled={investorsLoading || walletCreationStatus.processing}
                      aria-label="Select all investors"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>KYC Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investors.map((investor) => (
                  <TableRow key={investor.investor_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvestors.includes(
                          investor.investor_id
                        )}
                        onCheckedChange={() =>
                          handleSelectInvestor(investor.investor_id)
                        }
                        disabled={walletCreationStatus.processing}
                        aria-label={`Select ${investor.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{investor.name}</TableCell>
                    <TableCell>{investor.email}</TableCell>
                    <TableCell className="capitalize">
                      {investor.type}
                    </TableCell>
                    <TableCell>{investor.company || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          investor.kyc_status === "approved"
                            ? "bg-green-100 text-green-800"
                            : investor.kyc_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {investor.kyc_status || "not started"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Security Information</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
            <li>When you generate wallets in bulk, a backup file containing private keys will be downloaded.</li>
            <li>Store this file securely - anyone with access to these private keys can control the wallets.</li>
            <li>Consider distributing wallet access securely to each investor.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}