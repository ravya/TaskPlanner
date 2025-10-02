import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Modal size types
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

// Modal props interface
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  title?: string;
  description?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  centerContent?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  animate?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

// Modal size classes
const sizeClasses: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full h-full',
};

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Focus trap hook
const useFocusTrap = (isOpen: boolean, containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
};

// Body scroll lock hook
const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
};

// Close button component
const CloseButton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <button
    type="button"
    onClick={onClose}
    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors"
    aria-label="Close modal"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

// Main Modal component
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  description,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventScroll = true,
  centerContent = true,
  className,
  overlayClassName,
  contentClassName,
  animate = true,
  initialFocus,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(isOpen, modalRef);

  // Body scroll lock
  useBodyScrollLock(isOpen && preventScroll);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Focus initial element
  useEffect(() => {
    if (isOpen && initialFocus?.current) {
      setTimeout(() => {
        initialFocus.current?.focus();
      }, 100);
    }
  }, [isOpen, initialFocus]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Render nothing if not open and not animating
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            className={clsx(
              'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
              overlayClassName
            )}
            variants={animate ? backdropVariants : undefined}
            initial={animate ? 'hidden' : false}
            animate={animate ? 'visible' : false}
            exit={animate ? 'hidden' : false}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          />

          {/* Modal container */}
          <div
            className={clsx(
              'fixed inset-0 z-50 overflow-y-auto',
              'flex min-h-full items-end justify-center p-4 text-center',
              centerContent && 'sm:items-center sm:p-0'
            )}
            onClick={handleOverlayClick}
          >
            {/* Modal content */}
            <motion.div
              ref={modalRef}
              className={clsx(
                'modal-content',
                'relative transform overflow-hidden rounded-lg bg-white text-left shadow-strong',
                'transition-all w-full',
                sizeClasses[size],
                size === 'full' ? 'm-0' : 'sm:my-8',
                contentClassName,
                className
              )}
              variants={animate ? modalVariants : undefined}
              initial={animate ? 'hidden' : false}
              animate={animate ? 'visible' : false}
              exit={animate ? 'exit' : false}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              {showCloseButton && <CloseButton onClose={onClose} />}

              {/* Header */}
              {(title || description) && (
                <div className="px-6 pt-6 pb-4">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-gray-600">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={title || description ? 'px-6 pb-6' : 'p-6'}>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render to portal
  return createPortal(modalContent, document.body);
};

// Modal header component
export interface ModalHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  description,
  children,
  className,
}) => (
  <div className={clsx('px-6 pt-6 pb-4', className)}>
    {title && (
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h2>
    )}
    {description && (
      <p className="text-sm text-gray-600 mb-2">
        {description}
      </p>
    )}
    {children}
  </div>
);

// Modal body component
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => (
  <div className={clsx('px-6 py-4', className)}>
    {children}
  </div>
);

// Modal footer component
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div className={clsx('px-6 py-4 bg-gray-50 flex justify-end gap-3', className)}>
    {children}
  </div>
);

// Confirmation modal component
export interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  onClose,
  loading = false,
  ...modalProps
}) => {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      {...modalProps}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <ModalHeader title={title} />
      <ModalBody>
        <p className="text-sm text-gray-600">{message}</p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="btn-base btn-secondary btn-md"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={clsx(
            'btn-base btn-md',
            confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'
          )}
        >
          {loading ? 'Loading...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default Modal;