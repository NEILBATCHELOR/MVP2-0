/**
 * Utility for persisting form state across navigation
 */

// Types of forms we want to persist
export enum FormType {
  INVOICE_UPLOAD = "invoice_upload",
  INVOICE_FILTER = "invoice_filter",
  POOL_CREATE = "pool_create",
  POOL_FILTER = "pool_filter",
  TOKEN_CREATE = "token_create",
  TOKEN_ALLOCATION = "token_allocation"
}

/**
 * Save form state to session storage
 * 
 * @param formType The type of form
 * @param formData The form data to save
 */
export const saveFormState = <T>(formType: FormType, formData: T): void => {
  try {
    // Create a storage key based on the form type
    const storageKey = `factoring_form_${formType}`;
    
    // Save the form data to session storage
    sessionStorage.setItem(storageKey, JSON.stringify({
      data: formData,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error saving ${formType} form state:`, error);
  }
};

/**
 * Load form state from session storage
 * 
 * @param formType The type of form
 * @param maxAgeMs Maximum age of the form data in milliseconds (default 1 hour)
 * @returns The saved form data or null if not found or expired
 */
export const loadFormState = <T>(formType: FormType, maxAgeMs: number = 3600000): T | null => {
  try {
    // Create a storage key based on the form type
    const storageKey = `factoring_form_${formType}`;
    
    // Load the form data from session storage
    const storedData = sessionStorage.getItem(storageKey);
    
    if (!storedData) {
      return null;
    }
    
    const { data, timestamp } = JSON.parse(storedData);
    
    // Check if the data is expired
    const savedTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    
    if (currentTime - savedTime > maxAgeMs) {
      // Data is expired, clear it
      sessionStorage.removeItem(storageKey);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Error loading ${formType} form state:`, error);
    return null;
  }
};

/**
 * Clear form state from session storage
 * 
 * @param formType The type of form
 */
export const clearFormState = (formType: FormType): void => {
  try {
    // Create a storage key based on the form type
    const storageKey = `factoring_form_${formType}`;
    
    // Remove the form data from session storage
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Error clearing ${formType} form state:`, error);
  }
};

/**
 * Clear all form states from session storage
 */
export const clearAllFormStates = (): void => {
  try {
    // Get all keys from session storage
    const keys = Object.keys(sessionStorage);
    
    // Remove all form state data
    keys.forEach(key => {
      if (key.startsWith('factoring_form_')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all form states:', error);
  }
};

export default {
  FormType,
  saveFormState,
  loadFormState,
  clearFormState,
  clearAllFormStates
};