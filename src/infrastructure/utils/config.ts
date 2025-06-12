// Configuration utilities
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || import.meta.env?.[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue || '';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};
