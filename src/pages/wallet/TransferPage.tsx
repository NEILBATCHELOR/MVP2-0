import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/services/wallet/WalletContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  QrCode, 
  ArrowUpCircle,
  ChevronDown, 
  BarChart3, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { TransferGasSettings } from "@/components/wallet/components/transfer/TransferGasSettings";
import { TransferConfirmation } from "@/components/wallet/components/transfer/TransferConfirmation";
import { QrCodeScanner } from "@/components/wallet/components/transfer/QrCodeScanner";
import { RecentAddresses } from "@/components/wallet/components/transfer/RecentAddresses";
import { TransactionConfirmation } from "@/components/wallet/components/TransactionConfirmation";
import { ErrorDisplay } from "@/components/wallet/components/ErrorDisplay";
import { MultiSigTransactionConfirmation } from "@/components/wallet/components/multisig/MultiSigTransactionConfirmation";
import * as MultiSigWalletManager from "@/services/wallet/MultiSigWalletService";

// Schema for the transfer form
const transferSchema = z.object({
  fromWallet: z.string().min(1, "Please select a wallet"),
  toAddress: z.string().min(42, "Invalid wallet address").max(44, "Invalid wallet address"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  asset: z.string().min(1, "Please select an asset"),
  gasOption: z.enum(["slow", "standard", "fast"]),
});

type TransferFormValues = z.infer<typeof transferSchema>;

// Transfer page states
type TransferState = "input" | "confirmation" | "processing" | "success" | "error" | "multisig_pending";

const TransferPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallets, selectedWallet } = useWallet();
  
  const [transferState, setTransferState] = useState<TransferState>("input");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMultiSig, setIsMultiSig] = useState(false);
  const [multiSigTxId, setMultiSigTxId] = useState<string | null>(null);
  const [multiSigWallet, setMultiSigWallet] = useState<any>(null);
  
  // Form for transfer
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWallet: selectedWallet?.id || "",
      toAddress: "",
      amount: "",
      asset: "ETH",
      gasOption: "standard",
    },
  });

  // Check if selected wallet is a multisig wallet
  useEffect(() => {
    const checkWalletType = async () => {
      const walletId = form.getValues("fromWallet");
      if (!walletId) return;
      
      try {
        // Check if this is a multisig wallet
        const wallets = await MultiSigWalletManager.getMultiSigWallets();
        const multiSigWallet = wallets.find(w => w.address === walletId);
        
        if (multiSigWallet) {
          setIsMultiSig(true);
          setMultiSigWallet(multiSigWallet);
        } else {
          setIsMultiSig(false);
          setMultiSigWallet(null);
        }
      } catch (error) {
        console.error("Error checking wallet type:", error);
        setIsMultiSig(false);
      }
    };
    
    checkWalletType();
  }, [form.watch("fromWallet")]);

  // Handle form submission
  const onSubmit = async (values: TransferFormValues) => {
    // First, transition to confirmation state
    setTransferState("confirmation");
  };

  // Handle transfer confirmation
  const handleConfirmTransfer = async () => {
    try {
      // If this is a multisig wallet, create a transaction proposal
      if (isMultiSig && multiSigWallet) {
        const values = form.getValues();
        
        // Propose a transaction to the multisig wallet
        const transactionId = await MultiSigWalletManager.proposeTransaction(
          multiSigWallet.id,
          values.toAddress,
          values.amount,
          "0x" // empty data for simple transfer
        );
        
        // Set the multisig transaction ID
        setMultiSigTxId(transactionId);
        setTransferState("multisig_pending");
        
        toast({
          title: "Transaction Proposed",
          description: "Your transfer has been proposed and requires additional signatures",
        });
        
        return;
      }
      
      // For regular wallets, process normally
      setTransferState("processing");
      
      // In a real app, this would call the wallet service to submit the transaction
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Set mock transaction hash
      setTransactionHash("0x3d016d979f9e5a9f96ed9e4eb0c6cd16e3731e89562f92d4623a21030c5c7f1a");
      
      // Show success
      setTransferState("success");
      
      toast({
        title: "Transaction Submitted",
        description: "Your transfer has been submitted to the network",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while processing your transaction");
      setTransferState("error");
      
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to submit transaction",
      });
    }
  };

  // Handle multisig transaction signing
  const handleSignTransaction = async () => {
    if (!multiSigTxId) return;
    
    try {
      // In a real implementation, this would generate a signature using the wallet
      const signature = "0x" + Array(130).fill("0").join("");
      
      // Submit signature
      await MultiSigWalletManager.confirmTransaction(multiSigTxId, signature);
      
      toast({
        title: "Transaction Signed",
        description: "Your signature has been added to the transaction",
      });
    } catch (error) {
      console.error("Error signing transaction:", error);
      toast({
        variant: "destructive",
        title: "Signature Failed",
        description: error instanceof Error ? error.message : "Failed to sign transaction",
      });
    }
  };

  // Handle QR code scanning
  const handleQrScan = (address: string) => {
    form.setValue("toAddress", address);
    setShowQrScanner(false);
  };

  // Share multisig transaction
  const handleShareTransaction = (txId: string) => {
    // In a real implementation, this would generate a shareable link
    navigator.clipboard.writeText(`https://app.chaincapital.com/multisig/tx/${txId}`);
  };

  // Function to handle back button click based on state
  const handleBack = () => {
    if (transferState === "confirmation") {
      setTransferState("input");
    } else if (transferState === "success" || transferState === "error" || transferState === "multisig_pending") {
      // Reset the form and go back to input state
      form.reset();
      setTransferState("input");
    } else {
      navigate("/wallet/dashboard");
    }
  };

  // Render transfer content based on state
  const renderTransferContent = () => {
    switch (transferState) {
      case "input":
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fromWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Wallet</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.length > 0 ? (
                        wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center">
                          <span className="mr-2">{wallet.name}</span>
                        <Badge variant="outline" className="ml-2">
                            {wallet.network}
                            </Badge>
                              <span className="ml-2 text-sm text-muted-foreground">
                                  {parseFloat(wallet.balance) > 0 ? `${parseFloat(wallet.balance).toFixed(4)}` : '0'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-wallets" disabled>
                          No wallets available - create one first
                        </SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the wallet to send from
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Address</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowQrScanner(true)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Enter the recipient's wallet address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="asset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                          <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                          <SelectItem value="MATIC">Polygon (MATIC)</SelectItem>
                          <SelectItem value="AVAX">Avalanche (AVAX)</SelectItem>
                          <SelectItem value="LINK">Chainlink (LINK)</SelectItem>
                          <SelectItem value="UNI">Uniswap (UNI)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <TransferGasSettings form={form} />

              <div className="pt-4">
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </div>
            </form>
          </Form>
        );
      
      case "confirmation":
        // Get the form values but ensure they're all defined for the required props
        const formValues = form.getValues();
        const formData = {
          fromWallet: formValues.fromWallet || "",
          toAddress: formValues.toAddress || "",
          amount: formValues.amount || "",
          asset: formValues.asset || "",
          gasOption: formValues.gasOption || "standard" as const,
        };
        
        return (
          <TransferConfirmation 
            formData={formData}
            onConfirm={handleConfirmTransfer} 
            onBack={() => setTransferState("input")} 
          />
        );
      
      case "processing":
        return (
          <TransactionConfirmation
            txHash={transactionHash}
            status="pending"
            title="Transfer Processing"
            description="Your transfer is being processed on the blockchain"
            details={{
              from: form.getValues("fromWallet"),
              to: form.getValues("toAddress"),
              amount: form.getValues("amount"),
              asset: form.getValues("asset"),
              timestamp: new Date().toISOString(),
            }}
            onBack={handleBack}
          />
        );
      
      case "success":
        return (
          <TransactionConfirmation
            txHash={transactionHash}
            status="confirmed"
            title="Transfer Successful"
            description="Your transfer has been successfully completed"
            details={{
              from: form.getValues("fromWallet"),
              to: form.getValues("toAddress"),
              amount: form.getValues("amount"),
              asset: form.getValues("asset"),
              timestamp: new Date().toISOString(),
            }}
            onBack={handleBack}
          />
        );
      
      case "error":
        return (
          <ErrorDisplay
            errorCode={errorMessage?.includes("insufficient funds") ? "INSUFFICIENT_FUNDS" : 
                      errorMessage?.includes("user rejected") ? "REJECTED_BY_USER" : 
                      errorMessage?.includes("network") ? "NETWORK_ERROR" : "UNKNOWN"}
            error={errorMessage || "An error occurred during the transfer."}
            onRetry={() => {
              setTransferState("confirmation");
              setErrorMessage(null);
            }}
            onBack={handleBack}
          />
        );
      
      case "multisig_pending":
        if (!multiSigTxId || !multiSigWallet) {
          return <div>Error loading multisig transaction</div>;
        }
        
        return (
          <MultiSigTransactionConfirmation
            transactionId={multiSigTxId}
            walletId={multiSigWallet.id}
            txHash={null}
            title="Multisig Transfer"
            description="This transfer requires multiple signatures"
            details={{
              from: multiSigWallet.name,
              to: form.getValues("toAddress"),
              amount: form.getValues("amount"),
              asset: form.getValues("asset"),
              timestamp: new Date().toISOString(),
            }}
            threshold={multiSigWallet.threshold}
            owners={multiSigWallet.owners}
            canSign={true} // This would be determined by checking if the current user is an owner
            onSignTransaction={handleSignTransaction}
            onShareTransaction={handleShareTransaction}
            onBack={handleBack}
          />
        );
      
      default:
        return null;
    }
  };

  // Show message if no wallets available
  if (!wallets.length && transferState === "input") {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => navigate("/wallet")} className="mr-4">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Transfer Assets</h1>
              <p className="text-muted-foreground">Send tokens across multiple blockchains</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <p className="text-lg mb-2">No wallets found</p>
                <p className="text-sm mb-4">You need to create or connect a wallet before you can transfer assets</p>
                <div className="space-x-2">
                  <Button onClick={() => navigate("/wallet/new")}>
                    Create Wallet
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/wallet/demo")}>
                    Connect Wallet
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={handleBack} className="mr-4">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transfer Assets</h1>
            <p className="text-muted-foreground">Send tokens across multiple blockchains</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-8">
        <div className="md:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>
                {transferState === "input" && "Transfer Details"}
                {transferState === "confirmation" && "Confirm Transfer"}
                {transferState === "processing" && "Processing Transaction"}
                {transferState === "success" && "Transaction Successful"}
                {transferState === "error" && "Transaction Failed"}
                {transferState === "multisig_pending" && "Multisig Transfer"}
              </CardTitle>
              <CardDescription>
                {transferState === "input" && "Send assets to another wallet address"}
                {transferState === "confirmation" && "Verify the transfer details before confirming"}
                {transferState === "processing" && "Your transaction is being processed"}
                {transferState === "success" && "Your transfer has been completed"}
                {transferState === "error" && "There was an error processing your transaction"}
                {transferState === "multisig_pending" && "This transfer requires multiple signatures"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTransferContent()}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Addresses</CardTitle>
              <CardDescription>Quickly select from previously used addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAddresses onSelectAddress={(address) => {
                form.setValue("toAddress", address);
              }} />
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>Current network conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Fee</span>
                    <Badge variant="outline">
                      {form.watch("gasOption") === "slow" ? "Low" : 
                       form.watch("gasOption") === "standard" ? "Medium" : "High"} Priority
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated Time</span>
                    <span className="text-sm">
                      {form.watch("gasOption") === "slow" ? "5-10 min" : 
                       form.watch("gasOption") === "standard" ? "1-3 min" : "< 30 sec"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gas Price</span>
                    <span className="text-sm">
                      {form.watch("gasOption") === "slow" ? "25 Gwei" : 
                       form.watch("gasOption") === "standard" ? "35 Gwei" : "50 Gwei"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* QR Code Scanner Dialog */}
      {showQrScanner && (
        <QrCodeScanner 
          onClose={() => setShowQrScanner(false)} 
          onScan={handleQrScan} 
        />
      )}
    </div>
  );
};

export default TransferPage;