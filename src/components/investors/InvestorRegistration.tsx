import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { investorTypeCategories } from "@/utils/compliance/investorTypes";
import CountrySelector from "@/components/shared/CountrySelector";
import { useWallet } from "@/services/wallet/WalletContext";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/infrastructure/database/client";

const InvestorRegistration = () => {
  const navigate = useNavigate();
  const { generateNewAddress } = useWallet();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    investorType: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    acceptTerms: false,
    generateWallet: true, // Default to generating a wallet
    walletAddress: "", // Store wallet address if generated
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [walletGenerating, setWalletGenerating] = useState(false);
  const [walletPrivateKey, setWalletPrivateKey] = useState<string | null>(null);
  const [walletBackupDownloaded, setWalletBackupDownloaded] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    // Clear error when user selects
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, acceptTerms: checked });

    // Clear error when user checks
    if (errors.acceptTerms) {
      setErrors({ ...errors, acceptTerms: "" });
    }
  };

  const handleWalletGenerateToggle = (checked: boolean) => {
    setFormData({ ...formData, generateWallet: checked });
    
    // Reset wallet data if toggled off
    if (!checked) {
      setFormData(prev => ({ ...prev, walletAddress: "" }));
      setWalletPrivateKey(null);
      setWalletBackupDownloaded(false);
    }
  };

  const handleGenerateWallet = async () => {
    setWalletGenerating(true);
    
    try {
      // Generate wallet using the wallet context
      const wallet = generateNewAddress();
      
      setFormData(prev => ({ ...prev, walletAddress: wallet.address }));
      setWalletPrivateKey(wallet.privateKey);
      
      toast({
        title: "Wallet Generated",
        description: "Ethereum wallet has been generated. Please download the backup file.",
      });
    } catch (error) {
      console.error("Error generating wallet:", error);
      toast({
        variant: "destructive",
        title: "Wallet Generation Failed",
        description: "Failed to generate Ethereum wallet. Please try again.",
      });
    } finally {
      setWalletGenerating(false);
    }
  };

  const downloadWalletBackup = () => {
    if (!walletPrivateKey || !formData.walletAddress) return;
    
    const backupData = JSON.stringify({
      address: formData.walletAddress,
      privateKey: walletPrivateKey,
      name: formData.fullName,
      email: formData.email,
      createdAt: new Date().toISOString(),
    }, null, 2);
    
    const blob = new Blob([backupData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `investor-wallet-backup-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    setWalletBackupDownloaded(true);
    
    toast({
      title: "Backup Downloaded",
      description: "Store this file securely. Anyone with access to this private key can control the wallet.",
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.investorType) {
      newErrors.investorType = "Investor type is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.country) {
      newErrors.country = "Country of residence is required";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    if (formData.generateWallet && !formData.walletAddress) {
      newErrors.wallet = "Please generate a wallet to continue";
    }

    if (formData.generateWallet && walletPrivateKey && !walletBackupDownloaded) {
      newErrors.walletBackup = "Please download your wallet backup before continuing";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // In a real app, you would save the user to the database here
        // For this demo, we'll create a mock investor record in Supabase
        const { data, error } = await supabase
          .from('investors')
          .insert([
            {
              name: formData.fullName,
              email: formData.email,
              type: formData.investorType,
              wallet_address: formData.walletAddress,
              kyc_status: 'pending',
              created_at: new Date().toISOString(),
            }
          ]);

        if (error) throw error;

        // Successfully saved, proceed to next step
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully.",
        });
        
        navigate("/investor/verification");
      } catch (error) {
        console.error("Error saving investor:", error);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "Failed to create investor record. Please try again.",
        });
      }
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!formData.password) return { strength: 0, label: "" };

    const hasLowercase = /[a-z]/.test(formData.password);
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
    const isLongEnough = formData.password.length >= 8;

    const criteria = [
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSpecial,
      isLongEnough,
    ];
    const metCriteria = criteria.filter(Boolean).length;

    if (metCriteria <= 2) return { strength: 25, label: "Weak" };
    if (metCriteria === 3) return { strength: 50, label: "Fair" };
    if (metCriteria === 4) return { strength: 75, label: "Good" };
    return { strength: 100, label: "Strong" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Chain Capital SPV</h1>
          </div>
          <div className="text-sm text-gray-500">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 text-primary"
              onClick={() =>
                navigate("/", {
                  state: { openLogin: true, userType: "investor" },
                })
              }
            >
              Sign in
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Register as an Investor</h1>
            <span className="text-sm font-medium text-gray-500">
              Step 1 of 4
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Create your account to access investment opportunities
          </p>
          <Progress value={25} className="h-2" />
        </div>

        <Card className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="investorType">Investor Type</Label>
                  <Select
                    value={formData.investorType}
                    onValueChange={(value) =>
                      handleSelectChange("investorType", value)
                    }
                  >
                    <SelectTrigger
                      id="investorType"
                      className={errors.investorType ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select investor type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {investorTypeCategories.map((category) => (
                        <SelectGroup key={category.id}>
                          <SelectLabel>{category.name}</SelectLabel>
                          {category.types.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.investorType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.investorType}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your business email"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {formData.password && (
                      <div className="mt-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.strength <= 25 ? "bg-red-500" : passwordStrength.strength <= 50 ? "bg-yellow-500" : passwordStrength.strength <= 75 ? "bg-blue-500" : "bg-green-500"}`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Password strength: {passwordStrength.label}
                        </p>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <CountrySelector
                    id="country"
                    label="Country of Residence"
                    value={formData.country}
                    onValueChange={(value) =>
                      handleSelectChange("country", value)
                    }
                    error={errors.country}
                    required
                  />
                </div>

                {/* Wallet Generation Option */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Ethereum Wallet
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Generate a new Ethereum wallet for receiving investments
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="generate-wallet"
                        checked={formData.generateWallet}
                        onCheckedChange={handleWalletGenerateToggle}
                      />
                      <Label htmlFor="generate-wallet">
                        {formData.generateWallet ? "Enable" : "Disable"}
                      </Label>
                    </div>
                  </div>

                  {formData.generateWallet && (
                    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <Label>Wallet Address</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {formData.walletAddress ? (
                              <>
                                <span className="font-mono text-sm truncate max-w-xs md:max-w-md">
                                  {formData.walletAddress}
                                </span>
                                <Check className="h-4 w-4 text-green-500" />
                              </>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                No wallet address generated yet
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                          <Button
                            type="button"
                            variant={formData.walletAddress ? "outline" : "default"}
                            size="sm"
                            onClick={handleGenerateWallet}
                            disabled={walletGenerating}
                          >
                            {walletGenerating ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                Generating...
                              </>
                            ) : formData.walletAddress ? (
                              "Generate New"
                            ) : (
                              "Generate Wallet"
                            )}
                          </Button>
                          {walletPrivateKey && (
                            <Button
                              type="button"
                              variant={walletBackupDownloaded ? "outline" : "secondary"}
                              size="sm"
                              onClick={downloadWalletBackup}
                              disabled={walletBackupDownloaded}
                            >
                              {walletBackupDownloaded ? "Backup Downloaded" : "Download Backup"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {walletPrivateKey && !walletBackupDownloaded && (
                        <Alert>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-700">
                            <strong>Important:</strong> Download your wallet backup before continuing.
                            Anyone with access to this private key will have full control over the wallet.
                          </AlertDescription>
                        </Alert>
                      )}

                      {errors.wallet && (
                        <p className="text-red-500 text-sm mt-1">{errors.wallet}</p>
                      )}
                      
                      {errors.walletBackup && (
                        <p className="text-red-500 text-sm mt-1">{errors.walletBackup}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={handleCheckboxChange}
                    className={errors.acceptTerms ? "border-red-500" : ""}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-red-500 text-sm">
                        {errors.acceptTerms}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg">
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Chain Capital - Unlock Trapped
          Capital at Scale. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default InvestorRegistration;