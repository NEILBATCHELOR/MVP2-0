import { useToast as useUIToast } from '@/components/ui/use-toast';
import { ToastActionElement } from '@/components/ui/toast';

interface ToastOptions {
  title?: string;
  description?: string;
  status?: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  isClosable?: boolean;
  position?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left';
  action?: ToastActionElement;
}

/**
 * Custom toast hook that adapts the UI component library toast
 * to a more general-purpose API
 */
export const useToast = () => {
  const { toast } = useUIToast();

  const showToast = ({
    title,
    description,
    status = 'info',
    duration = 5000,
    isClosable = true,
    position = 'bottom-right',
    action,
  }: ToastOptions) => {
    // Map status to variant
    let variant: 'default' | 'destructive' = 'default';
    if (status === 'error') {
      variant = 'destructive';
    }
    
    toast({
      title,
      description,
      variant,
      duration,
      action,
    });
  };

  return showToast;
}; 