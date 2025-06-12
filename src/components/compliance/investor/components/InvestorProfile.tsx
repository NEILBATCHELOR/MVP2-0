import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOnboarding } from '../context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const formSchema = z.object({
  accreditationType: z.string().min(1, 'Please select your accreditation type'),
  investmentExperience: z.string().min(1, 'Please select your investment experience'),
  taxResidency: z.string().min(1, 'Please select your tax residency'),
  taxIdNumber: z.string().min(1, 'Tax ID number is required'),
  riskTolerance: z.string().min(1, 'Please select your risk tolerance'),
  investmentGoals: z.string().min(10, 'Please describe your investment goals'),
});

type InvestorProfileFormData = z.infer<typeof formSchema>;

const investmentExperienceOptions = [
  { value: 'low', label: 'Low (Less than 2 years)' },
  { value: 'moderate', label: 'Moderate (2-5 years)' },
  { value: 'high', label: 'High (5-10 years)' },
  { value: 'expert', label: 'Expert (10+ years)' },
];

const riskToleranceOptions = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

const accreditationTypes = [
  { value: 'retail', label: 'Retail Investor' },
  { value: 'accredited', label: 'Accredited Investor' },
  { value: 'qualified', label: 'Qualified Purchaser' },
  { value: 'institutional', label: 'Institutional Investor' },
];

export const InvestorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateInvestorData, updateComplianceStatus, isDevelopmentMode } = useOnboarding();

  const form = useForm<InvestorProfileFormData>({
    resolver: isDevelopmentMode ? undefined : zodResolver(formSchema),
    defaultValues: {
      accreditationType: '',
      investmentExperience: '',
      taxResidency: state.investorData.countryOfResidence || '',
      taxIdNumber: '',
      riskTolerance: '',
      investmentGoals: '',
    },
  });

  const onSubmit = async (data: InvestorProfileFormData) => {
    try {
      // Skip validation in development mode
      if (isDevelopmentMode) {
        updateInvestorData({
          accreditationType: data.accreditationType || 'accredited', // Default value
          investmentExperience: data.investmentExperience || 'high', // Default value
          taxResidency: data.taxResidency || 'us', // Default value
          taxIdNumber: data.taxIdNumber || '123-45-6789', // Default value
          riskTolerance: data.riskTolerance || 'moderate', // Default value
          investmentGoals: data.investmentGoals || 'Sample investment goals', // Default value
        });

        updateComplianceStatus({
          accreditationStatus: 'pending_review',
          taxDocumentationStatus: 'in_progress',
          overallProgress: 40,
        });

        navigate('/compliance/investor-onboarding/kyc');
        return;
      }

      // Regular validation and submission
      updateInvestorData({
        accreditationType: data.accreditationType,
        investmentExperience: data.investmentExperience,
        taxResidency: data.taxResidency,
        taxIdNumber: data.taxIdNumber,
        riskTolerance: data.riskTolerance,
        investmentGoals: data.investmentGoals,
      });

      updateComplianceStatus({
        accreditationStatus: 'pending_review',
        taxDocumentationStatus: 'in_progress',
        overallProgress: 40,
      });

      navigate('/compliance/investor-onboarding/kyc');
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const riskClassification = form.watch('riskTolerance');
  const accreditationType = form.watch('accreditationType');

  return (
    <Card className="bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold">Investor Profile & Qualification</h2>
        <p className="text-gray-500 mt-2">
          Provide information about your investment profile and qualifications
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="accreditationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investor Accreditation Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select accreditation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accreditationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your investor classification determines which investment opportunities are available
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investmentExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Experience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investment experience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {investmentExperienceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxResidency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Residency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ch">Switzerland</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="gb">United Kingdom</SelectItem>
                        {/* Add more countries */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxIdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your tax ID number" {...field} />
                    </FormControl>
                    <FormDescription>
                      For US residents, enter your SSN or EIN
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="riskTolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tolerance</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tolerance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {riskToleranceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investmentGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your investment goals and objectives..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {accreditationType && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {accreditationType === 'retail' ? (
                  <span className="text-amber-600">
                    As a Retail Investor, you may have limited access to certain investment opportunities.
                    Additional verification may be required.
                  </span>
                ) : (
                  <span className="text-blue-600">
                    Your selected investor classification requires additional documentation for verification.
                    You will be prompted to provide this in the next steps.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {riskClassification && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Based on your profile and documentation, your investor risk level is:{' '}
                <span className="font-medium">
                  {riskClassification === 'conservative'
                    ? 'Low Risk'
                    : riskClassification === 'moderate'
                    ? 'Moderate Risk'
                    : 'High Risk'}
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default InvestorProfile;