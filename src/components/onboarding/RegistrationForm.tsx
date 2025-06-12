import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import OnboardingLayout from "./OnboardingLayout";
import CountrySelector from "@/components/shared/CountrySelector";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
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
      newErrors.country = "Country is required";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Proceed to next step
      navigate("/onboarding/organization");
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
    <OnboardingLayout
      currentStep={1}
      totalSteps={6}
      title="Register as an Issuer"
      description="Create your account to start setting up your SPV"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Enter your organization name"
              className={errors.organizationName ? "border-red-500" : ""}
            />
            {errors.organizationName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.organizationName}
              </p>
            )}
          </div>

          <div>
            <CountrySelector
              id="country"
              label="Country of Registration"
              value={formData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
              error={errors.country}
              required
            />
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
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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
                <p className="text-red-500 text-sm">{errors.acceptTerms}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg">
            Create Account
          </Button>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 text-primary font-medium hover:underline"
              onClick={() =>
                navigate("/", {
                  state: { openLogin: true, userType: "issuer" },
                })
              }
            >
              Sign in
            </Button>
          </p>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default RegistrationForm;
