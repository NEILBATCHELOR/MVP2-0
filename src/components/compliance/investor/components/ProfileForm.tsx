import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOnboarding } from '../context/OnboardingContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  dateOfBirth: z.date(),
  investmentExperience: z.enum(['none', 'beginner', 'intermediate', 'advanced']),
  investmentGoals: z.string().min(10, 'Please provide more detail about your investment goals'),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  preferredInvestmentSize: z.enum(['0-50k', '50k-250k', '250k-1m', '1m+']),
});

type FormData = z.infer<typeof formSchema>;

export const ProfileForm: React.FC = () => {
  const { updateFormData, nextStep, isDevelopmentMode } = useOnboarding();

  const form = useForm<FormData>({
    resolver: isDevelopmentMode ? undefined : zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      jobTitle: '',
      phoneNumber: '',
      dateOfBirth: new Date(),
      investmentExperience: 'none',
      investmentGoals: '',
      riskTolerance: 'moderate',
      preferredInvestmentSize: '0-50k',
    }
  });

  const onSubmit = async (values: FormData) => {
    if (isDevelopmentMode) {
      nextStep();
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateFormData(values);
      nextStep();
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter job title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <DatePicker
                date={field.value}
                onSelect={field.onChange}
              />
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
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Experience</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
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
                  placeholder="Describe your investment goals and objectives"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="riskTolerance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Risk Tolerance</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your risk tolerance" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredInvestmentSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Investment Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0-50k">$0 - $50,000</SelectItem>
                  <SelectItem value="50k-250k">$50,000 - $250,000</SelectItem>
                  <SelectItem value="250k-1m">$250,000 - $1,000,000</SelectItem>
                  <SelectItem value="1m+">$1,000,000+</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </Form>
  );
}; 