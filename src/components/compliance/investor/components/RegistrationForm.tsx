import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOnboarding } from '../context/OnboardingContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getAllInvestorTypes, investorTypeCategories } from '@/utils/compliance/investorTypes';
import { getAllCountries, regionCountries } from '@/utils/compliance/countries';
import { Card } from '@/components/ui/card';
import { PasswordMeter } from './PasswordMeter';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  investorType: z.enum(['individual', 'institutional']),
  country: z.string().min(1, 'Please select your country'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { updateFormData, nextStep, isDevelopmentMode } = useOnboarding();
  const [countrySearch, setCountrySearch] = useState('');
  const [investorTypeSearch, setInvestorTypeSearch] = useState('');

  // Get all countries and investor types
  const allCountries = useMemo(() => getAllCountries(), []);
  const allInvestorTypes = useMemo(() => getAllInvestorTypes(), []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries;
    const searchLower = countrySearch.toLowerCase();
    return allCountries.filter(country => 
      country.name.toLowerCase().includes(searchLower)
    );
  }, [countrySearch, allCountries]);

  // Filter investor types based on search
  const filteredInvestorTypes = useMemo(() => {
    if (!investorTypeSearch) return investorTypeCategories;
    const searchLower = investorTypeSearch.toLowerCase();
    return investorTypeCategories.map(category => ({
      ...category,
      types: category.types.filter(type =>
        type.name.toLowerCase().includes(searchLower)
      )
    })).filter(category => category.types.length > 0);
  }, [investorTypeSearch]);

  const form = useForm<FormData>({
    resolver: isDevelopmentMode ? undefined : zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      investorType: 'individual',
      country: '',
      acceptTerms: false
    }
  });

  const onSubmit = async (values: FormData) => {
    if (isDevelopmentMode) {
      nextStep();
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateFormData(values);
      nextStep();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <Card className="bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold">Register as an Investor</h2>
        <p className="text-gray-500 mt-2">
          Create your account to access investment opportunities
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Add your full name" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Add your business email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investor Type</FormLabel>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Search investor types..."
                      value={investorTypeSearch}
                      onChange={(e) => setInvestorTypeSearch(e.target.value)}
                      className="mb-2"
                      autoComplete="off"
                    />
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investor type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredInvestorTypes.map(category => (
                          <React.Fragment key={category.id}>
                            <SelectItem value={category.id} disabled className="font-semibold">
                              {category.name}
                            </SelectItem>
                            {category.types.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </React.Fragment>
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
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country of Residence</FormLabel>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="mb-2"
                      autoComplete="off"
                    />
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionCountries.map(region => (
                          <React.Fragment key={region.id}>
                            <SelectItem value={region.id} disabled className="font-semibold">
                              {region.name}
                            </SelectItem>
                            {filteredCountries
                              .filter(country => 
                                region.countries.some(rc => rc.id === country.id)
                              )
                              .map(country => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        autoComplete="new-password" 
                        {...field} 
                      />
                    </FormControl>
                    <PasswordMeter password={field.value} />
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
                    <FormControl>
                      <Input 
                        type="password" 
                        autoComplete="new-password" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Terms and Conditions</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Accept our terms and conditions
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

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

export default RegistrationForm;