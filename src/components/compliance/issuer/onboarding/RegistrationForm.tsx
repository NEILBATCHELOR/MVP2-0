import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { regionCountries } from "@/utils/compliance/countries";
import { useState } from "react";

// Password strength criteria
const hasLowerCase = (str: string) => /[a-z]/.test(str);
const hasUpperCase = (str: string) => /[A-Z]/.test(str);
const hasNumber = (str: string) => /[0-9]/.test(str);
const hasSpecialChar = (str: string) => /[^A-Za-z0-9]/.test(str);

const formSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  countryOfRegistration: z.string().min(1, "Please select your country of registration"),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const RegistrationForm: React.FC = () => {
  const { state, updateOrganization, nextStep, isDevelopmentMode } = useIssuerOnboarding();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>("");
  
  // Filter regions and countries based on search query
  const filteredRegions = countrySearchQuery 
    ? regionCountries.map(region => ({
        ...region,
        countries: region.countries.filter(country => 
          country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()))
      })).filter(region => region.countries.length > 0)
    : regionCountries;

  const form = useForm<FormData>({
    resolver: isDevelopmentMode ? undefined : zodResolver(formSchema),
    defaultValues: {
      name: state.organization.name || "",
      businessEmail: state.organization.businessEmail || "",
      password: "",
      confirmPassword: "",
      countryOfRegistration: state.organization.countryOfRegistration || "",
      acceptTerms: false
    }
  });

  const onSubmit = async (values: FormData) => {
    if (isDevelopmentMode) {
      // Set some default values if fields are empty
      if (!values.name) {
        values.name = "Demo Organization";
      }
      if (!values.countryOfRegistration) {
        values.countryOfRegistration = "us";
      }
      if (!values.businessEmail) {
        values.businessEmail = "demo@example.com";
      }
    }
    
    // Update organization data
    updateOrganization({
      name: values.name,
      businessEmail: values.businessEmail,
      countryOfRegistration: values.countryOfRegistration
    });
    
    // Move to next step
    nextStep();
  };

  // Get current password value for strength meter
  const password = form.watch("password") || "";
  
  // Calculate password strength
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "None", color: "bg-gray-200" };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (hasLowerCase(password)) strength += 1;
    if (hasUpperCase(password)) strength += 1;
    if (hasNumber(password)) strength += 1;
    if (hasSpecialChar(password)) strength += 1;
    
    if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 4) return { strength, label: "Medium", color: "bg-yellow-500" };
    return { strength, label: "Strong", color: "bg-green-500" };
  };
  
  const passwordStrength = getPasswordStrength(password);

  return (
    <Card className="bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold">Register your Organization</h2>
        <p className="text-gray-500 mt-2">
          Create your account to begin the issuer onboarding process
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your organization name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countryOfRegistration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country of Registration</FormLabel>
                <div className="space-y-2">
                  <Input
                    placeholder="Search countries..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-80">
                      {filteredRegions.map((region) => (
                        region.countries.length > 0 && (
                          <SelectGroup key={region.id}>
                            <SelectLabel>{region.name}</SelectLabel>
                            {region.countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your business email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      {...field} 
                    />
                  </FormControl>
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs">Password strength: {passwordStrength.label}</div>
                      <div className="text-xs">{password.length} characters</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${passwordStrength.color}`} 
                        style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className={`text-xs ${hasLowerCase(password) ? "text-green-600" : "text-gray-400"}`}>
                        • Lowercase letter
                      </div>
                      <div className={`text-xs ${hasUpperCase(password) ? "text-green-600" : "text-gray-400"}`}>
                        • Uppercase letter
                      </div>
                      <div className={`text-xs ${hasNumber(password) ? "text-green-600" : "text-gray-400"}`}>
                        • Number
                      </div>
                      <div className={`text-xs ${hasSpecialChar(password) ? "text-green-600" : "text-gray-400"}`}>
                        • Special character
                      </div>
                      <div className={`text-xs ${password.length >= 8 ? "text-green-600" : "text-gray-400"}`}>
                        • 8+ characters
                      </div>
                      <div className={`text-xs ${password.length >= 12 ? "text-green-600" : "text-gray-400"}`}>
                        • 12+ characters (stronger)
                      </div>
                    </div>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...field} 
                    />
                  </FormControl>
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I accept the{" "}
                    <Link to="#" className="text-blue-600 hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end mt-8">
            <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-2">
              {isDevelopmentMode ? "Skip to Next Step" : "Create Account"}
            </Button>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/auth/signin" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default RegistrationForm;