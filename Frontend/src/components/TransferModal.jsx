import { useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Copy, Scissors, X, Loader2 } from 'lucide-react';
import { useDialogA11y } from '../hooks/useDialogA11y';

// Critically damped (bounce: 0) — this dialog opens from a click, not a
// flick or drag, so it shouldn't overshoot. See apple-design skill §4.
const SPRING = { type: 'spring', bounce: 0, duration: 0.3 };

/**
 * TransferModal
 * Props:
 *   file          – the dragged file object { id, name, accountId, accountEmail, ... }
 *   targetAccount – the drop target account { _id, email }
 *   onConfirm(action: 'copy'|'move') – called when user confirms
 *   onCancel()    – called when user dismisses
 *   isTransferring – boolean, disables buttons while in-flight
 */
const TransferModal = ({ file, targetAccount, onConfirm, onCancel, isTransferring }) => {
    const [selected, setSelected] = useState(null); // 'copy' | 'move'
    const titleId = useId();
    const containerRef = useDialogA11y(true, isTransferring ? () => {} : onCancel);
    const reduceMotion = useReducedMotion();

    const handleConfirm = () => {
        if (selected) onConfirm(selected);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isTransferring ? onCancel : undefined}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            />

            {/* Card — animates from its live (presentation) value if this
                interrupts a still-running enter/exit, so a fast cancel-then-
                reopen doesn't snap. */}
            <motion.div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 12 }}
                transition={SPRING}
            >

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 id={titleId} className="text-lg font-bold text-gray-900 dark:text-gray-100">Transfer File</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Choose how to move <span className="font-semibold text-gray-700 dark:text-gray-300">"{file?.name}"</span>
                        </p>
                    </div>
                    {!isTransferring && (
                        <button onClick={onCancel} aria-label="Close dialog" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all active:scale-[0.97]">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Route visual */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[150px]" title={file?.accountEmail}>
                            {file?.accountEmail}
                        </span>
                        <ArrowRight className="w-4 h-4 text-teal-500 shrink-0" />
                        <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-medium truncate max-w-[150px]" title={targetAccount?.email}>
                            {targetAccount?.email}
                        </span>
                    </div>
                </div>

                {/* Action selection */}
                <div className="p-6 space-y-3">
                    {/* Copy option */}
                    <button
                        onClick={() => setSelected('copy')}
                        disabled={isTransferring}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${selected === 'copy'
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className={`p-2 rounded-lg shrink-0 ${selected === 'copy' ? 'bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                            <Copy className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Copy</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Keep the original in the source account and add a copy to the target.</p>
                        </div>
                    </button>

                    {/* Move option */}
                    <button
                        onClick={() => setSelected('move')}
                        disabled={isTransferring}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${selected === 'move'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className={`p-2 rounded-lg shrink-0 ${selected === 'move' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                            <Scissors className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Move</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Transfer to the target account and <span className="text-orange-600 dark:text-orange-400 font-medium">delete</span> the original from source.</p>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        disabled={isTransferring}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selected || isTransferring}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${selected === 'move'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-teal-600 hover:bg-teal-700'
                            }`}
                    >
                        {isTransferring && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isTransferring ? 'Transferring…' : selected === 'move' ? 'Move File' : 'Copy File'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TransferModal;
