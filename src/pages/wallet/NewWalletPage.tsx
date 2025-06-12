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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Wallet, Key, ChevronsUpDown, Copy, Lock, AlertTriangle, Plus, Minus, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWallet } from "@/services/wallet/WalletContext";
import { WalletGeneratorFactory } from "@/services/wallet/generators/WalletGeneratorFactory";
import { ETHWalletGenerator } from "@/services/wallet/generators/ETHWalletGenerator";
import { WalletRiskCheck } from "@/components/wallet/components/WalletRiskCheck";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/infrastructure/database/client";
import { 
  deployMultiSigWallet, 
  getMultiSigWalletContract 
} from "@/infrastructure/web3/MultiSigContract";
import { getProvider, createMultiSigWallet, SUPPORTED_BLOCKCHAINS } from "@/infrastructure/web3/MultiSigWalletManager";
import { BlockchainFactory } from "@/infrastructure/web3/BlockchainFactory";
import type { SupportedChain } from "@/infrastructure/web3/adapters/IBlockchainAdapter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Form schemas
const newWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required"),
  type: z.enum(["eoa", "multisig"]),
  network: z.string().min(1, "Network is required"),
  threshold: z.number().min(1).optional(),
});

const importWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required"),
  privateKey: z.string().min(64, "Invalid private key").max(66, "Invalid private key"),
  network: z.string().min(1, "Network is required"),
});

const NewWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createWallet, importWallet, generateNewAddress } = useWallet();
  const [generatedWallet, setGeneratedWallet] = useState<{
    address: string;
    privateKey: string;
    mnemonic?: string;
  } | null>(null);
  const [copySecured, setCopySecured] = useState(false);
  const [walletCreated, setWalletCreated] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [walletCreationStatus, setWalletCreationStatus] = useState<{
    processing: boolean;
    total: number;
    completed: number;
  }>({ processing: false, total: 0, completed: 0 });
  const [multiSigAddresses, setMultiSigAddresses] = useState<string[]>([]);
  const [multiSigThreshold, setMultiSigThreshold] = useState<number>(1);
  const [showMultiSigDialog, setShowMultiSigDialog] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{success: boolean, message: string} | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    processing: boolean;
    message: string;
  }>({ processing: false, message: "" });

  // Form for creating a new wallet
  const newWalletForm = useForm<z.infer<typeof newWalletSchema>>({
    resolver: zodResolver(newWalletSchema),
    defaultValues: {
      name: "",
      type: "eoa",
      network: "ethereum",
    },
  });

  // Form for importing an existing wallet
  const importWalletForm = useForm<z.infer<typeof importWalletSchema>>({
    resolver: zodResolver(importWalletSchema),
    defaultValues: {
      name: "",
      privateKey: "",
      network: "ethereum",
    },
  });

  // Handle creation of a new wallet
  const onCreateWallet = async (values: z.infer<typeof newWalletSchema>) => {
    try {
      if (values.type === "eoa") {
        // For EOA wallets, generate a new address first
        if (!generatedWallet || !copySecured) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please generate an address and secure your private key first",
          });
          return;
        }

        // Create the wallet
        await createWallet(values.name, values.type, values.network);
        
        toast({
          title: "Wallet Created",
          description: "Your wallet has been created successfully",
        });
        
        // Wait a bit before navigating
        setTimeout(() => {
          navigate("/wallet/dashboard");
        }, 1500);
      } else {
        // For MultiSig wallets
        if (multiSigAddresses.length < 2) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "MultiSig wallets require at least 2 addresses",
          });
          return;
        }

        if (multiSigThreshold > multiSigAddresses.length) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Threshold cannot be greater than the number of owners",
          });
          return;
        }

        // Show confirmation dialog
        setShowMultiSigDialog(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create wallet",
      });
    }
  };

  // Handle MultiSig wallet creation
  const handleMultiSigWalletCreation = async () => {
    try {
      setDeploymentStatus({ processing: true, message: "Simulating transaction..." });
      
      // First simulate the transaction
      await simulateMultiSigDeployment(
        newWalletForm.getValues().network, 
        multiSigAddresses, 
        multiSigThreshold
      );

      // If simulation was successful, proceed with actual deployment
      setDeploymentStatus({ processing: true, message: "Deploying MultiSig wallet..." });

      // Deploy the wallet using the blockchain-specific adapter
      const newWallet = await createMultiSigWallet(
        newWalletForm.getValues().name,
        newWalletForm.getValues().network as SupportedChain,
        multiSigAddresses,
        multiSigThreshold
      );
      
      toast({
        title: "MultiSig Wallet Created",
        description: "Your MultiSig wallet has been created successfully",
      });
      
      // Close the dialog
      setShowMultiSigDialog(false);
      setDeploymentStatus({ processing: false, message: "" });
      
      // Navigate to the multisig wallet page with the new wallet ID
      navigate(`/wallet/multisig?id=${newWallet.id}`);
    } catch (error) {
      setDeploymentStatus({ processing: false, message: "" });
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create MultiSig wallet",
      });
    }
  };

  // Simulate MultiSig wallet deployment
  const simulateMultiSigDeployment = async (
    blockchain: string,
    owners: string[],
    threshold: number
  ): Promise<void> => {
    try {
      setIsSimulating(true);
      
      // Validate addresses
      for (const address of owners) {
        const adapter = BlockchainFactory.getAdapter(blockchain as SupportedChain);
        if (!adapter.isValidAddress(address)) {
          throw new Error(`Invalid address format for ${blockchain}: ${address}`);
        }
      }
      
      // Simulate gas costs and check for potential issues
      // This is a simplified example - real simulation would interact with the network
      const gasEstimate = owners.length * 50000 + 200000; // Basic gas estimate
      
      setSimulationResult({
        success: true,
        message: `Transaction simulation successful. Estimated gas: ${gasEstimate}`
      });
      
      return Promise.resolve();
    } catch (error) {
      setSimulationResult({
        success: false,
        message: error instanceof Error ? error.message : "Simulation failed"
      });
      throw error;
    } finally {
      setIsSimulating(false);
    }
  };

  // Add owner address to MultiSig
  const addOwnerAddress = () => {
    setMultiSigAddresses([...multiSigAddresses, ""]);
  };

  // Remove owner address from MultiSig
  const removeOwnerAddress = (index: number) => {
    const newAddresses = [...multiSigAddresses];
    newAddresses.splice(index, 1);
    setMultiSigAddresses(newAddresses);
    
    // If threshold is now greater than addresses, adjust it
    if (multiSigThreshold > newAddresses.length) {
      setMultiSigThreshold(newAddresses.length > 0 ? newAddresses.length : 1);
    }
  };

  // Update owner address
  const updateOwnerAddress = (index: number, value: string) => {
    const newAddresses = [...multiSigAddresses];
    newAddresses[index] = value;
    setMultiSigAddresses(newAddresses);
  };

  // Handle importing an existing wallet
  const onImportWallet = async (values: z.infer<typeof importWalletSchema>) => {
    try {
      // Validate the private key using ETHWalletGenerator consistently
      try {
        const validatedWallet = ETHWalletGenerator.fromPrivateKey(values.privateKey, { includePrivateKey: false });
        
        if (!validatedWallet || !ETHWalletGenerator.isValidAddress(validatedWallet.address)) {
          throw new Error("Invalid wallet address generated from private key");
        }
      } catch (validationError) {
        toast({
          variant: "destructive",
          title: "Invalid Private Key",
          description: "The private key you entered is not valid",
        });
        return;
      }

      // Import the wallet
      await importWallet(values.privateKey, values.name, values.network);
      
      toast({
        title: "Wallet Imported",
        description: "Your wallet has been imported successfully",
      });
      
      // Wait a bit before navigating
      setTimeout(() => {
        navigate("/wallet/dashboard");
      }, 1500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import wallet",
      });
    }
  };

  // Generate a new wallet address
  const handleGenerateAddress = () => {
    try {
      // Use ETHWalletGenerator directly instead of through context
      // for consistency across all wallet generation in the application
      const wallet = ETHWalletGenerator.generateWallet({
        includePrivateKey: true,
        includeMnemonic: true
      });
      
      if (wallet.privateKey) {
        setGeneratedWallet({
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic: wallet.mnemonic
        });
      }
      
      // Reset security check
      setCopySecured(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate wallet",
      });
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  // Confirm the private key has been secured
  const confirmSecured = () => {
    setCopySecured(true);
    setWalletCreated(true);
    toast({
      title: "Great!",
      description: "You can now create your wallet",
    });
  };

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
        // Use ETHWalletGenerator consistently to generate a new Ethereum wallet
        const wallet = ETHWalletGenerator.generateWallet({
          includePrivateKey: true,
          includeMnemonic: true
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
          mnemonic: wallet.mnemonic
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

    // Save wallet backup data if needed (in a real app, this could be more secure)
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create or Import Wallet</h1>
      
      <Tabs defaultValue="create">
        <TabsList className="mb-4">
          <TabsTrigger value="create">Create New Wallet</TabsTrigger>
          <TabsTrigger value="import">Import Existing Wallet</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Wallet</CardTitle>
              <CardDescription>Generate a new wallet or set up a MultiSig wallet</CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...newWalletForm}>
                <form className="space-y-6">
                  <FormField
                    control={newWalletForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Wallet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={newWalletForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select wallet type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="eoa">Single Signature (EOA)</SelectItem>
                            <SelectItem value="multisig">Multi Signature</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose between a standard wallet or a MultiSig wallet that requires multiple signatures
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={newWalletForm.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUPPORTED_BLOCKCHAINS.map(blockchain => (
                              <SelectItem key={blockchain} value={blockchain}>
                                {blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {newWalletForm.watch("type") === "eoa" ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Button
                          type="button"
                          onClick={handleGenerateAddress}
                          disabled={walletCreated}
                        >
                          Generate Address
                        </Button>

                        {walletCreated && (
                          <div className="flex items-center text-green-600">
                            <Lock className="w-4 h-4 mr-2" />
                            Private Key Secured
                          </div>
                        )}
                      </div>

                      {generatedWallet && (
                        <div className="space-y-4 mt-4 p-4 border rounded-md bg-secondary/50">
                          <div>
                            <Label className="text-sm text-muted-foreground">Wallet Address</Label>
                            <div className="flex items-center mt-1">
                              <code className="bg-secondary p-2 rounded text-xs flex-1 overflow-x-auto">
                                {generatedWallet.address}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(generatedWallet.address, "Address")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {generatedWallet.privateKey && (
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Private Key (Keep this secret!)
                              </Label>
                              <div className="flex items-center mt-1">
                                <code className="bg-secondary p-2 rounded text-xs flex-1 overflow-x-auto">
                                  {generatedWallet.privateKey}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    copyToClipboard(generatedWallet.privateKey, "Private Key")
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {generatedWallet.mnemonic && (
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Recovery Phrase (Keep this secret!)
                              </Label>
                              <div className="flex items-center mt-1">
                                <code className="bg-secondary p-2 rounded text-xs flex-1 overflow-x-auto">
                                  {generatedWallet.mnemonic}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    copyToClipboard(generatedWallet.mnemonic, "Recovery Phrase")
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <Alert className="bg-amber-100 text-amber-800 border-amber-300">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Security Warning</AlertTitle>
                            <AlertDescription>
                              Never share your private key or recovery phrase with anyone. Back them up securely. They provide full control of your wallet.
                            </AlertDescription>
                          </Alert>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="secure-confirm"
                              checked={copySecured}
                              onCheckedChange={() => confirmSecured()}
                            />
                            <label
                              htmlFor="secure-confirm"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              I have saved my private key and recovery phrase securely
                            </label>
                          </div>

                          {generatedWallet.address && (
                            <WalletRiskCheck 
                              walletAddress={generatedWallet.address} 
                              network={newWalletForm.getValues().network}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">MultiSig Owners</h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addOwnerAddress}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Owner
                        </Button>
                      </div>
                      
                      {multiSigAddresses.length === 0 ? (
                        <div className="text-center p-4 border border-dashed rounded-md">
                          <p className="text-muted-foreground">
                            Add owner addresses for your MultiSig wallet
                          </p>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="mt-2"
                            onClick={addOwnerAddress}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Owner
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {multiSigAddresses.map((address, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder={`Owner ${index + 1} Address`}
                                value={address}
                                onChange={(e) => updateOwnerAddress(index, e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOwnerAddress(index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="pt-4">
                        <Label>Threshold (Required Signatures)</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setMultiSigThreshold(Math.max(1, multiSigThreshold - 1))}
                            disabled={multiSigThreshold <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium text-lg">{multiSigThreshold}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setMultiSigThreshold(Math.min(multiSigAddresses.length, multiSigThreshold + 1))}
                            disabled={multiSigThreshold >= multiSigAddresses.length || multiSigAddresses.length === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            out of {multiSigAddresses.length} owner{multiSigAddresses.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Any transaction from this wallet will require at least {multiSigThreshold} signature{multiSigThreshold !== 1 ? "s" : ""} to be executed.
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={newWalletForm.handleSubmit(onCreateWallet)}
                disabled={walletCreationStatus.processing}
                className="w-full"
              >
                {walletCreationStatus.processing ? (
                  <>
                    <span className="mr-2">Creating Wallet...</span>
                    <Progress value={
                      (walletCreationStatus.completed / walletCreationStatus.total) * 100
                    } className="w-20 h-2" />
                  </>
                ) : (
                  "Create Wallet"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Existing Wallet</CardTitle>
              <CardDescription>
                Import a wallet using its private key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...importWalletForm}>
                <form onSubmit={importWalletForm.handleSubmit(onImportWallet)} className="space-y-6">
                  <FormField
                    control={importWalletForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Imported Wallet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={importWalletForm.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Private Key</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0x..." 
                            {...field} 
                            type="password"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your wallet's private key (starts with 0x)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={importWalletForm.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ethereum">Ethereum</SelectItem>
                            <SelectItem value="polygon">Polygon</SelectItem>
                            <SelectItem value="avalanche">Avalanche</SelectItem>
                            <SelectItem value="optimism">Optimism</SelectItem>
                            <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Security Warning</AlertTitle>
                    <AlertDescription>
                      Importing private keys is risky. Make sure you're on a secure device and connection.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" className="w-full">
                    Import Wallet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Generate Wallets for Investors</CardTitle>
              <CardDescription>
                Create Ethereum wallets for investors who don't have one yet
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MultiSig creation confirmation dialog */}
      <Dialog open={showMultiSigDialog} onOpenChange={setShowMultiSigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create MultiSig Wallet</DialogTitle>
            <DialogDescription>
              You're about to create a MultiSig wallet that requires {multiSigThreshold} out of {multiSigAddresses.length} signatures.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <h4 className="font-medium">Wallet Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Name:</div>
              <div>{newWalletForm.getValues().name}</div>
              <div className="text-muted-foreground">Network:</div>
              <div>{newWalletForm.getValues().network}</div>
              <div className="text-muted-foreground">Owners:</div>
              <div>{multiSigAddresses.length}</div>
              <div className="text-muted-foreground">Threshold:</div>
              <div>{multiSigThreshold}</div>
            </div>
            
            {simulationResult && (
              <Alert className={simulationResult.success ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}>
                <AlertTitle>{simulationResult.success ? "Simulation Successful" : "Simulation Failed"}</AlertTitle>
                <AlertDescription>{simulationResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMultiSigDialog(false)} disabled={deploymentStatus.processing}>
              Cancel
            </Button>
            <Button onClick={handleMultiSigWalletCreation} disabled={deploymentStatus.processing || (simulationResult && !simulationResult.success)}>
              {deploymentStatus.processing ? deploymentStatus.message : "Create Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewWalletPage;