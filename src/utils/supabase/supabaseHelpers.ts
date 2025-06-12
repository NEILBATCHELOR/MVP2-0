import { supabase } from "@/infrastructure/database/client";

export const getErrorMessage = (error: any): string => {
  return error?.message || "An unknown error occurred";
};

export const logSupabaseError = (error: any, context: string): void => {
  console.error(`Supabase error in ${context}:`, error);
};

export const handleSupabaseError = (error: any, context: string): string => {
  logSupabaseError(error, context);
  return getErrorMessage(error);
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const handleSupabaseResponse = async <T>(
  promise: Promise<{ data: T | null; error: any }>,
  context: string
): Promise<T[]> => {
  try {
    const { data, error } = await promise;
    
    if (error) {
      logSupabaseError(error, context);
      throw new Error(getErrorMessage(error));
    }
    
    return data ? (Array.isArray(data) ? data : [data]) : [];
  } catch (error) {
    logSupabaseError(error, context);
    throw error;
  }
};

export const handleSupabaseSingleResponse = async <T>(
  promise: Promise<{ data: T | null; error: any }>,
  context: string
): Promise<T | null> => {
  try {
    const { data, error } = await promise;
    
    if (error) {
      logSupabaseError(error, context);
      throw new Error(getErrorMessage(error));
    }
    
    return data;
  } catch (error) {
    logSupabaseError(error, context);
    throw error;
  }
};
