// Shared form types
export interface FormValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: FormValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormField<T = any> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  validation?: (value: any) => string | undefined;
}
