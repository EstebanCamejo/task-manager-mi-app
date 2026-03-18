export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  /** For info-only modals (single button). */
  hideCancel?: boolean;
}
