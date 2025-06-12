import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const InvestorProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accreditationType: "",
    investmentExperience: "",
    taxResidency: "",
    taxId: "",
    investmentGoals: "",
    riskTolerance: "",
  });
  const [riskScore, setRiskScore] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accreditationType) {
      newErrors.accreditationType = "Accreditation type is required";
    }

    if (!formData.investmentExperience) {
      newErrors.investmentExperience = "Investment experience is required";
    }

    if (!formData.taxResidency) {
      newErrors.taxResidency = "Tax residency is required";
    }

    if (!formData.taxId) {
      newErrors.taxId = "Tax ID is required";
    }

    if (!formData.riskTolerance) {
      newErrors.riskTolerance = "Risk tolerance is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Proceed to next step
      navigate("/investor/kyc");
    }
  };

  // Dynamically calculate risk score based on form data
  React.useEffect(() => {
    // This is a simplified risk calculation logic
    // In a real application, this would be more complex
    let calculatedRisk: "low" | "medium" | "high" = "low";

    if (formData.investmentExperience === "low") {
      calculatedRisk = "high";
    } else if (formData.investmentExperience === "medium") {
      calculatedRisk = "medium";
    }

    if (formData.riskTolerance === "aggressive") {
      calculatedRisk = calculatedRisk === "high" ? "high" : "medium";
    } else if (formData.riskTolerance === "conservative") {
      calculatedRisk = "low";
    }

    setRiskScore(calculatedRisk);
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Guardian SPV</h1>
          </div>
          <div className="text-sm text-gray-500">
            Need help?{" "}
            <a href="#" className="text-primary">
              Contact support
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">
              Investor Profile & Qualification
            </h1>
            <span className="text-sm font-medium text-gray-500">
              Step 3 of 4
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Provide information about your investment profile and qualifications
          </p>
          <Progress value={75} className="h-2" />
        </div>

        <Card className="bg-white rounded-lg shadow-sm mb-6">
          <CardHeader>
            <CardTitle>Investor Profile & Qualification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="accreditationType">
                    Investor Accreditation Type
                  </Label>
                  <Select
                    value={formData.accreditationType}
                    onValueChange={(value) =>
                      handleSelectChange("accreditationType", value)
                    }
                  >
                    <SelectTrigger
                      id="accreditationType"
                      className={
                        errors.accreditationType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select accreditation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_net_worth">
                        High-Net-Worth Individual
                      </SelectItem>
                      <SelectItem value="institutional">
                        Institutional Investor
                      </SelectItem>
                      <SelectItem value="regulated_fund">
                        Regulated Fund
                      </SelectItem>
                      <SelectItem value="retail">Retail Investor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.accreditationType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.accreditationType}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="investmentExperience">
                    Investment Experience
                  </Label>
                  <Select
                    value={formData.investmentExperience}
                    onValueChange={(value) =>
                      handleSelectChange("investmentExperience", value)
                    }
                  >
                    <SelectTrigger
                      id="investmentExperience"
                      className={
                        errors.investmentExperience ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        Low (Less than 2 years)
                      </SelectItem>
                      <SelectItem value="medium">Medium (2-5 years)</SelectItem>
                      <SelectItem value="high">High (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.investmentExperience && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.investmentExperience}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxResidency">Tax Residency</Label>
                  <Select
                    value={formData.taxResidency}
                    onValueChange={(value) =>
                      handleSelectChange("taxResidency", value)
                    }
                  >
                    <SelectTrigger
                      id="taxResidency"
                      className={errors.taxResidency ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select tax residency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                      <SelectItem value="sg">Singapore</SelectItem>
                      <SelectItem value="ch">Switzerland</SelectItem>
                      <SelectItem value="eu">European Union</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.taxResidency && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.taxResidency}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxId">Tax ID Number</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    placeholder="Enter your tax ID number"
                    className={errors.taxId ? "border-red-500" : ""}
                  />
                  {errors.taxId && (
                    <p className="text-red-500 text-sm mt-1">{errors.taxId}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    For US residents, enter your SSN or EIN. For others, enter
                    your tax identification number.
                  </p>
                </div>

                <div>
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select
                    value={formData.riskTolerance}
                    onValueChange={(value) =>
                      handleSelectChange("riskTolerance", value)
                    }
                  >
                    <SelectTrigger
                      id="riskTolerance"
                      className={errors.riskTolerance ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.riskTolerance && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.riskTolerance}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center md:col-span-2">
                  <Card className="w-full flex flex-col justify-center p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${riskScore === "low" ? "bg-green-100" : riskScore === "medium" ? "bg-yellow-100" : "bg-red-100"}`}
                      >
                        <Shield
                          className={`h-6 w-6 ${riskScore === "low" ? "text-green-600" : riskScore === "medium" ? "text-yellow-600" : "text-red-600"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          Investor Risk Classification
                        </p>
                        <p
                          className={`text-sm font-semibold ${riskScore === "low" ? "text-green-600" : riskScore === "medium" ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {riskScore === "low"
                            ? "Low Risk"
                            : riskScore === "medium"
                              ? "Medium Risk"
                              : "High Risk"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="investmentGoals">Investment Goals</Label>
                  <Textarea
                    id="investmentGoals"
                    name="investmentGoals"
                    value={formData.investmentGoals}
                    onChange={handleChange}
                    placeholder="Describe your investment goals and objectives..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/investor/verification")}
                >
                  Back
                </Button>
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
          &copy; {new Date().getFullYear()} Guardian SPV. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default InvestorProfile;
