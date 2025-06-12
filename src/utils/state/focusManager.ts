/**
 * Utility to manage focus for better accessibility without causing conflicts
 */

/**
 * Store the previously focused element before dialog was opened
 */
let previouslyFocusedElement: HTMLElement | null = null;

/**
 * Safely save the currently focused element
 */
export function saveFocus(): void {
  if (document.activeElement instanceof HTMLElement) {
    previouslyFocusedElement = document.activeElement;
  }
}

/**
 * Restore focus to the saved element
 */
export function restoreFocus(): void {
  if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
    // Small delay to ensure DOM changes have settled
    setTimeout(() => {
      previouslyFocusedElement?.focus();
      previouslyFocusedElement = null;
    }, 0);
  }
}

/**
 * Focus trap for dialogs - keeps focus within the dialog
 * 
 * @param dialogRef The dialog element reference
 * @returns Cleanup function to remove event listeners
 */
export function trapFocus(dialogRef: HTMLElement): () => void {
  const focusableElements = dialogRef.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return () => {};
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Focus the first element
  firstElement?.focus();
  
  // Handle tab key to trap focus within dialog
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    // If shift+tab on first element, go to last element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } 
    // If tab on last element, go to first element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  dialogRef.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    dialogRef.removeEventListener('keydown', handleKeyDown);
  };
}