import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useFocusTrap from '@/hooks/shared/useFocusTrap';

// Interface for the ModalPortal props
interface ModalPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * ModalPortal component that renders its children in a portal outside the main DOM hierarchy
 * and manages accessibility
 */
export function ModalPortal({ children, isOpen }: ModalPortalProps) {
  // Reference to track if we've already set up accessibility attributes
  const hasSetInert = useRef(false);
  
  // Use the focus trap hook
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);
  
  useEffect(() => {
    // Get the modal root element
    const modalRoot = document.getElementById('modal-root');
    
    if (!modalRoot) {
      console.error('Modal root element not found. Add <div id="modal-root"></div> to your HTML.');
      return;
    }
    
    // Get the main root element
    const mainRoot = document.getElementById('root');
    
    if (isOpen) {
      // For accessibility, make non-modal content inert or hidden
      // But only apply if browser supports inert attribute
      if (mainRoot && !hasSetInert.current) {
        try {
          // Try to use inert (preferred)
          if ('inert' in HTMLElement.prototype) {
            mainRoot.setAttribute('inert', '');
          } else {
            // Fallback to aria-hidden
            mainRoot.setAttribute('aria-hidden', 'true');
          }
          hasSetInert.current = true;
        } catch (error) {
          console.error('Error applying accessibility attributes:', error);
        }
      }
      
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // When modal closes, remove accessibility attributes
      if (mainRoot && hasSetInert.current) {
        try {
          mainRoot.removeAttribute('inert');
          mainRoot.removeAttribute('aria-hidden');
          hasSetInert.current = false;
        } catch (error) {
          console.error('Error removing accessibility attributes:', error);
        }
      }
      
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
    }
    
    // Handle escape key to close modals
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If ESC is pressed and modal is open, close it
        document.dispatchEvent(new CustomEvent('radix-dialog-close'));
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    // Cleanup function when component unmounts
    return () => {
      if (mainRoot) {
        // Clean up all accessibility attributes
        mainRoot.removeAttribute('inert');
        mainRoot.removeAttribute('aria-hidden');
        hasSetInert.current = false;
      }
      
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);
  
  // Always render the portal - let the parent control visibility
  return createPortal(
    <div 
      ref={focusTrapRef} 
      role="dialog"
      aria-modal="true"
      style={{ 
        position: 'relative', 
        zIndex: 9999,
        display: isOpen ? 'block' : 'none' 
      }}
    >
      {children}
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

export default ModalPortal;