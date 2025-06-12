import { useEffect, useRef } from 'react';

/**
 * A hook that traps focus within a specified element.
 * Use this hook to improve accessibility of modals, dialogs, and dropdown menus.
 * 
 * @param isActive Whether the focus trap is active
 * @returns A ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const rootElement = ref.current;
    
    // Save the element that was focused before the dialog opened
    const previouslyFocused = document.activeElement as HTMLElement;

    // Find all focusable elements within the dialog
    const focusableElements = rootElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Set focus to the first focusable element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Function to handle focusing inside the dialog
    const handleKeyDown = (e: KeyboardEvent) => {
      // If key is not Tab, do nothing
      if (e.key !== 'Tab') return;

      // SHIFT + TAB
      if (e.shiftKey) {
        // If focused on first element, wrap to last focusable element
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      }
      // TAB
      else {
        // If focused on last element, wrap to first focusable element
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    // Add event listener
    rootElement.addEventListener('keydown', handleKeyDown);

    // Clean up when component unmounts or trap becomes inactive
    return () => {
      rootElement.removeEventListener('keydown', handleKeyDown);
      
      // Return focus to the element that was focused before the dialog was opened
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isActive]);

  return ref;
}

export default useFocusTrap;