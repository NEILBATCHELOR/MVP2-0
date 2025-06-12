/**
 * Clipboard utilities for copying text and showing user feedback
 */

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Copy address with user feedback
 */
export async function copyAddress(address: string): Promise<{ success: boolean; message: string }> {
  if (!address) {
    return { success: false, message: 'No address to copy' };
  }
  
  const success = await copyToClipboard(address);
  
  return {
    success,
    message: success ? 'Address copied to clipboard' : 'Failed to copy address'
  };
}

/**
 * Copy transaction hash with user feedback
 */
export async function copyTransactionHash(hash: string): Promise<{ success: boolean; message: string }> {
  if (!hash) {
    return { success: false, message: 'No transaction hash to copy' };
  }
  
  const success = await copyToClipboard(hash);
  
  return {
    success,
    message: success ? 'Transaction hash copied to clipboard' : 'Failed to copy transaction hash'
  };
}

/**
 * Copy formatted text with user feedback
 */
export async function copyText(text: string, description: string = 'text'): Promise<{ success: boolean; message: string }> {
  if (!text) {
    return { success: false, message: `No ${description} to copy` };
  }
  
  const success = await copyToClipboard(text);
  
  return {
    success,
    message: success ? `${description} copied to clipboard` : `Failed to copy ${description}`
  };
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext) || 
         (document.queryCommandSupported && document.queryCommandSupported('copy'));
}
