import { supabase } from '@/infrastructure/database/client';

// Wrapper for Supabase Auth API
export const signUp = (params: Parameters<typeof supabase.auth.signUp>[0]) =>
  supabase.auth.signUp(params);

export const signInWithPassword = (params: Parameters<typeof supabase.auth.signInWithPassword>[0]) =>
  supabase.auth.signInWithPassword(params);

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const getUser = () => supabase.auth.getUser();

export const resetPasswordForEmail = (
  email: string,
  options: Parameters<typeof supabase.auth.resetPasswordForEmail>[1]
) => supabase.auth.resetPasswordForEmail(email, options);

export const updateUser = (attributes: Parameters<typeof supabase.auth.updateUser>[0]) =>
  supabase.auth.updateUser(attributes);

export const onAuthStateChange = (
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) => supabase.auth.onAuthStateChange(callback);
