import { useState } from 'react';
import { ArrowRight, Copy, Scissors, X, Loader2 } from 'lucide-react';

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

    const handleConfirm = () => {
        if (selected) onConfirm(selected);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isTransferring ? onCancel : undefined}
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Transfer File</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Choose how to move <span className="font-semibold text-gray-700 dark:text-gray-300">"{file?.name}"</span>
                        </p>
                    </div>
                    {!isTransferring && (
                        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
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
                        <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-medium truncate max-w-[150px]" title={targetAccount?.email}>
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
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${selected === 'copy'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className={`p-2 rounded-lg shrink-0 ${selected === 'copy' ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
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
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${selected === 'move'
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
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selected || isTransferring}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selected === 'move'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {isTransferring && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isTransferring ? 'Transferring…' : selected === 'move' ? 'Move File' : 'Copy File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
