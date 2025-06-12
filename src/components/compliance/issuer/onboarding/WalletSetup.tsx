import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
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
import { Switch } from "@/components/ui/switch";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";
import {
  AlertCircle,
  Copy,
  Wallet,
  Shield,
  AlertTriangle,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SignatoryInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

const WalletSetup: React.FC = () => {
  const { state, updateWallet, nextStep, previousStep } = useIssuerOnboarding();
  const [walletStatus, setWalletStatus] = useState<
    "pending" | "blocked" | "active"
  >("active");
  const [blockchain, setBlockchain] = useState("ethereum");
  const [walletAddress, setWalletAddress] = useState(state.wallet.address || "");
  const [isMultiSig, setIsMultiSig] = useState(state.wallet.isMultiSig || false);
  const [signatories, setSignatories] = useState<SignatoryInfo[]>(
    state.wallet.signatories 
      ? state.wallet.signatories.map((sig, index) => ({
          id: (index + 1).toString(),
          name: sig.name,
          email: "", // Since your Signatory type doesn't include email, using empty string
          role: "approver",
        }))
      : [
          {
            id: "1",
            name: "Primary Issuer",
            email: "issuer@example.com",
            role: "primary",
          },
        ]
  );
  const [newSignatory, setNewSignatory] = useState<Omit<SignatoryInfo, "id">>({
    name: "",
    email: "",
    role: "approver",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);

  const handleBlockchainChange = (value: string) => {
    setBlockchain(value);
  };

  const handleMultiSigToggle = (checked: boolean) => {
    setIsMultiSig(checked);
  };

  const handleNewSignatoryChange = (
    field: keyof typeof newSignatory,
    value: string,
  ) => {
    setNewSignatory({ ...newSignatory, [field]: value });
  };

  const handleAddSignatory = () => {
    if (!newSignatory.name || !newSignatory.email) {
      setErrors({
        ...errors,
        newSignatory: "Please fill in all signatory information fields",
      });
      return;
    }

    const newId = (signatories.length + 1).toString();
    setSignatories([...signatories, { ...newSignatory, id: newId }]);

    // Reset form
    setNewSignatory({
      name: "",
      email: "",
      role: "approver",
    });

    setErrors({ ...errors, newSignatory: "" });
  };

  const handleRemoveSignatory = (id: string) => {
    // Don't allow removing the primary issuer
    if (id === "1") return;

    setSignatories(signatories.filter((sig) => sig.id !== id));
  };

  const generateWallet = async () => {
    try {
      setIsGeneratingWallet(true);
      
      // Generate a new wallet using ethers.js
      const wallet = ethers.Wallet.createRandom();
      const newWalletAddress = wallet.address;
      
      // Update the wallet address state
      setWalletAddress(newWalletAddress);
      
      setIsGeneratingWallet(false);
    } catch (error) {
      console.error("Error generating wallet:", error);
      setErrors({
        ...errors,
        wallet: "Failed to generate wallet. Please try again.",
      });
      setIsGeneratingWallet(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    // In a real app, you would show a toast notification here
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!walletAddress) {
      newErrors.wallet = "Please generate or enter a wallet address";
    }

    if (isMultiSig && signatories.length < 2) {
      newErrors.signatories =
        "Multi-signature wallet requires at least 2 signatories";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Map signatories to the format expected by IssuerOnboardingContext
      const mappedSignatories = signatories.map(sig => ({
        name: sig.name,
        address: `0x${Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}` // Generate random address for signatories
      }));

      // Update wallet in context
      updateWallet({
        address: walletAddress,
        isActivated: true,
        isMultiSig,
        signatories: isMultiSig ? mappedSignatories : undefined,
        threshold: isMultiSig ? Math.ceil(signatories.length / 2) : undefined, // Default threshold to majority
      });

      // Proceed to next step
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Wallet Setup</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Blockchain & Wallet Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="blockchain">Select Blockchain</Label>
              <Select value={blockchain} onValueChange={handleBlockchainChange}>
                <SelectTrigger id="blockchain">
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Select the blockchain network for your wallet
              </p>
              
              <div className="mt-4">
                <Button 
                  type="button" 
                  onClick={generateWallet}
                  disabled={isGeneratingWallet}
                  className="w-full"
                >
                  {isGeneratingWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Generate New Wallet
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Card className="w-full h-full flex flex-col justify-center p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Wallet Address</p>
                    <p className="text-sm text-gray-500">{walletAddress ? "Ready to use" : "Not generated yet"}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {errors.wallet && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.wallet}</AlertDescription>
            </Alert>
          )}

          {walletStatus === "blocked" && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your wallet is currently blocked. Please complete all compliance
                requirements to activate your wallet.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                {walletAddress ? "Wallet Address" : "Generate a Wallet Address"}
              </CardTitle>
              <CardDescription>
                {walletAddress 
                  ? "This is your dedicated wallet address for issuance" 
                  : "Click the Generate New Wallet button to create a secure wallet"
                }
              </CardDescription>
            </CardHeader>
            {walletAddress && (
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md font-mono">
                  <span className="text-sm">{walletAddress}</span>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Multi-Signature Setup</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="multi-sig-toggle"
                checked={isMultiSig}
                onCheckedChange={handleMultiSigToggle}
              />
              <Label htmlFor="multi-sig-toggle">
                {isMultiSig ? "Enabled" : "Disabled"}
              </Label>
            </div>
          </div>

          {isMultiSig && (
            <div className="space-y-6">
              {errors.signatories && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.signatories}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {signatories.map((signatory) => (
                  <div
                    key={signatory.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{signatory.name}</p>
                      <p className="text-sm text-gray-500">{signatory.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${signatory.role === "primary" ? "bg-blue-100 text-blue-800" : signatory.role === "trustee" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {signatory.role === "primary"
                          ? "Primary Issuer"
                          : signatory.role === "trustee"
                            ? "Trustee"
                            : signatory.role === "legal"
                              ? "Legal Representative"
                              : signatory.role === "admin"
                                ? "Fund Administrator"
                                : "Approver"}
                      </Badge>
                      {signatory.id !== "1" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSignatory(signatory.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Signatory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="signatoryName">Name</Label>
                      <Input
                        id="signatoryName"
                        value={newSignatory.name}
                        onChange={(e) =>
                          handleNewSignatoryChange("name", e.target.value)
                        }
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="signatoryEmail">Email</Label>
                      <Input
                        id="signatoryEmail"
                        type="email"
                        value={newSignatory.email}
                        onChange={(e) =>
                          handleNewSignatoryChange("email", e.target.value)
                        }
                        placeholder="Enter email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="signatoryRole">Role</Label>
                      <Select
                        value={newSignatory.role}
                        onValueChange={(value) =>
                          handleNewSignatoryChange("role", value)
                        }
                      >
                        <SelectTrigger id="signatoryRole">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approver">Approver</SelectItem>
                          <SelectItem value="trustee">Trustee</SelectItem>
                          <SelectItem value="admin">
                            Fund Administrator
                          </SelectItem>
                          <SelectItem value="legal">
                            Legal Representative
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {errors.newSignatory && (
                    <p className="text-red-500 text-sm mt-3">
                      {errors.newSignatory}
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddSignatory}
                    className="w-full mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Signatory
                  </Button>
                </CardContent>
              </Card>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Multi-signature wallets require approval from multiple parties
                  for transactions, providing enhanced security and governance.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={previousStep}>
            Back
          </Button>
          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WalletSetup;