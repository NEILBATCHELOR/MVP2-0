/**
 * Utility to fix dialog accessibility issues at runtime
 */

/**
 * Fix accessibility issues with dialogs by ensuring proper aria attributes
 * and removing any problematic attributes that might cause conflicts
 */
export function fixDialogAccessibility(): void {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Run only once after initial render
  window.addEventListener('DOMContentLoaded', () => {
    // MutationObserver to watch for dialogs being added to the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            // Check if it's a dialog or contains dialogs
            if (node instanceof HTMLElement) {
              // Fix dialog directly if it is one
              if (node.getAttribute('role') === 'dialog') {
                fixDialogElement(node);
              }
              
              // Check for dialogs within the added node
              const dialogs = node.querySelectorAll('[role="dialog"]');
              dialogs.forEach(fixDialogElement);
            }
          });
        }
      }
    });

    // Start observing the document body for dialog changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Handle any dialogs that already exist at load time
    document.querySelectorAll('[role="dialog"]').forEach(fixDialogElement);
    
    // Also check for dialogs in the modal-root
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) {
      observer.observe(modalRoot, {
        childList: true,
        subtree: true,
      });
    }
  });
}

/**
 * Fix accessibility issues for a specific dialog element
 */
function fixDialogElement(dialog: Element): void {
  if (!(dialog instanceof HTMLElement)) return;
  
  // Ensure proper dialog attributes
  if (!dialog.hasAttribute('aria-modal')) {
    dialog.setAttribute('aria-modal', 'true');
  }
  
  // Fix the root issue - prevent aria-hidden conflict
  if (dialog.closest('[aria-hidden="true"]')) {
    const parent = dialog.closest('[aria-hidden="true"]');
    if (parent instanceof HTMLElement) {
      // Temporarily remove aria-hidden from parent when dialog is open
      if (dialog.getAttribute('data-state') === 'open') {
        parent.removeAttribute('aria-hidden');
        
        // Store the original state to restore later
        parent.dataset.hadAriaHidden = 'true';
      }
    }
  }
  
  // Reverse the fix when dialog closes
  const handleClose = () => {
    const parent = dialog.closest('[data-had-aria-hidden="true"]');
    if (parent instanceof HTMLElement) {
      parent.setAttribute('aria-hidden', 'true');
      delete parent.dataset.hadAriaHidden;
    }
  };
  
  // Watch for dialog state changes
  const stateObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-state') {
        const state = dialog.getAttribute('data-state');
        if (state === 'closed') {
          handleClose();
        }
      }
    });
  });
  
  stateObserver.observe(dialog, { attributes: true });
}