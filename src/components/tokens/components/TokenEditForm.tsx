import React, { useState, useEffect } from 'react';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TokenEditFormProps {
  token: any;
  onChange: (token: any) => void;
  onSave?: (token: any) => Promise<void>;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  description: z.string().optional(),
});

const TokenEditForm: React.FC<TokenEditFormProps> = ({ token, onChange, onSave }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: token.name || '',
      symbol: token.symbol || '',
      description: token.description || '',
    },
  });

  // Update form when token changes
  useEffect(() => {
    form.reset({
      name: token.name || '',
      symbol: token.symbol || '',
      description: token.description || '',
    });
  }, [token, form]);

  // Update parent component when form values change
  const handleFormChange = (field: string, value: any) => {
    onChange({
      ...token,
      [field]: value,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Update token data
      const updatedToken = {
        ...token,
        ...data
      };
      
      // Call onChange to update the token in the parent component
      onChange(updatedToken);
      
      // If onSave is provided, call it
      if (onSave) {
        await onSave(updatedToken);
        
        // Show success toast
        toast({
          title: "Success",
          description: (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Token updated successfully</span>
            </div>
          ),
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error saving token:', error);
      toast({
        title: "Error",
        description: "Failed to save token changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    handleFormChange('name', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                The full name of the token (e.g., "Ethereum")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Symbol</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    handleFormChange('symbol', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                The symbol of the token (e.g., "ETH")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    handleFormChange('description', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                A brief description of the token and its purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {onSave && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default TokenEditForm;
