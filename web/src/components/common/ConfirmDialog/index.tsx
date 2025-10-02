import React from 'react';
import { clsx } from 'clsx';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

export type ConfirmDialogVariant = 'default' | 'danger' | 'warning' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const variantConfig = {
  default: {
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100',
    confirmButton: 'primary' as const,
  },
  danger: {
    iconColor: 'text-danger-600',
    iconBg: 'bg-danger-100',
    confirmButton: 'danger' as const,
  },
  warning: {
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-100',
    confirmButton: 'warning' as const,
  },
  success: {
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100',
    confirmButton: 'success' as const,
  },
};

const defaultIcons = {
  default: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  danger: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  icon,
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const config = variantConfig[variant];
  const displayIcon = icon || defaultIcons[variant];

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
    // Don't auto-close - let parent handle closing after async operation
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading && closeOnOverlayClick}
      closeOnEscape={!loading && closeOnEscape}
      className={className}
    >
      <div className="px-6 py-6">
        <div className="flex items-start">
          {/* Icon */}
          <div className={clsx(
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
            config.iconBg
          )}>
            <div className={config.iconColor}>
              {displayIcon}
            </div>
          </div>

          {/* Content */}
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={loading}
          size="md"
        >
          {cancelText}
        </Button>
        
        <Button
          variant={config.confirmButton}
          onClick={handleConfirm}
          loading={loading}
          size="md"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

// Utility function to create confirmation dialogs imperatively
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    props: Omit<ConfirmDialogProps, 'isOpen' | 'onClose'> | null;
    resolve: ((confirmed: boolean) => void) | null;
  }>({
    isOpen: false,
    props: null,
    resolve: null,
  });

  const confirm = React.useCallback((props: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        props: {
          ...props,
          onConfirm: () => {
            resolve(true);
            setDialogState(prev => ({ ...prev, isOpen: false }));
          },
        },
        resolve,
      });
    });
  }, []);

  const handleClose = React.useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState({
      isOpen: false,
      props: null,
      resolve: null,
    });
  }, [dialogState.resolve]);

  const ConfirmDialogComponent = dialogState.props ? (
    <ConfirmDialog
      {...dialogState.props}
      isOpen={dialogState.isOpen}
      onClose={handleClose}
    />
  ) : null;

  return {
    confirm,
    ConfirmDialogComponent,
  };
};

// Pre-built confirmation dialogs for common use cases
export const DeleteConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'icon' | 'confirmText'> & {
  itemName?: string;
}> = ({ itemName = 'this item', title, message, ...props }) => (
  <ConfirmDialog
    {...props}
    variant="danger"
    confirmText="Delete"
    title={title || `Delete ${itemName}?`}
    message={message || `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
  />
);

export const UnsavedChangesDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'icon' | 'confirmText' | 'cancelText'>> = ({
  title,
  message,
  ...props
}) => (
  <ConfirmDialog
    {...props}
    variant="warning"
    confirmText="Discard Changes"
    cancelText="Keep Editing"
    title={title || 'Unsaved Changes'}
    message={message || 'You have unsaved changes. Are you sure you want to leave without saving?'}
  />
);

export const LogoutConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'icon' | 'confirmText'>> = ({
  title,
  message,
  ...props
}) => (
  <ConfirmDialog
    {...props}
    variant="default"
    confirmText="Sign Out"
    title={title || 'Sign Out?'}
    message={message || 'Are you sure you want to sign out of your account?'}
  />
);

export default ConfirmDialog;