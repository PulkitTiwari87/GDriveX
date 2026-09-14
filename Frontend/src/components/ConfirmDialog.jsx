import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Modal from './Modal';

// Styled, accessible replacement for window.confirm() — used for
// destructive actions (delete file, unlink account, etc.).
const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = true,
    isLoading = false,
    onConfirm,
    onCancel,
}) => (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onCancel} title={title}>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <div className="flex items-center justify-end gap-3 mt-6">
            <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
                {cancelLabel}
            </button>
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2',
                    destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
                )}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Please wait…' : confirmLabel}
            </button>
        </div>
    </Modal>
);

export default ConfirmDialog;
