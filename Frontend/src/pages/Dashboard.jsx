import { useState, useCallback, useEffect, useId, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
    defaultDropAnimation as defaultDropAnimationConfiguration,
} from '@dnd-kit/core';
import { useDropzone } from 'react-dropzone';
import useDriveStore from '../store/useDriveStore';
import TransferModal from '../components/TransferModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

// Critically damped (bounce: 0) — these dialogs open from a click or a drag
// drop, not a flick, so they shouldn't overshoot. See apple-design skill §4.
const DIALOG_SPRING = { type: 'spring', bounce: 0, duration: 0.3 };
import {
    Plus, Upload, FileText, Image as ImageIcon, File, Trash2,
    ExternalLink, HardDrive, MoreVertical, Unlink, CheckCircle2,
    ArrowLeftRight, CheckCircle, AlertCircle, X, Folder,
    ChevronRight, FolderOpen, Loader2, Square, CheckSquare,
    Copy, MoveRight, Layers, LayoutList, Eye, ZoomIn,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ toasts, onDismiss }) => (
    <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
        {toasts.map(t => (
            <div
                key={t.id}
                className={clsx(
                    'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[280px] max-w-sm',
                    t.leaving
                        ? 'transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] opacity-0 translate-x-4 motion-reduce:translate-x-0'
                        : 'animate-toast-in',
                    t.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                )}
            >
                {t.type === 'success'
                    ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
                    : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                }
                <span className="flex-1">{t.message}</span>
                <button onClick={() => onDismiss(t.id)} aria-label="Dismiss notification" className="opacity-60 hover:opacity-100 transition-all active:scale-[0.9]">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        ))}
    </div>
);

// ─── File Icon ────────────────────────────────────────────────────────────────
const FileIcon = ({ mimeType, isFolder }) => {
    if (isFolder || mimeType === 'application/vnd.google-apps.folder')
        return <Folder className="w-5 h-5 text-amber-400 shrink-0" />;
    if (!mimeType) return <File className="w-5 h-5 text-gray-400 shrink-0" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500 shrink-0" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
        return <FileText className="w-5 h-5 text-green-500 shrink-0" />;
    if (mimeType.includes('document') || mimeType.includes('word'))
        return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
    if (mimeType.includes('vnd.google-apps')) return <FileText className="w-5 h-5 text-blue-400 shrink-0" />;
    return <File className="w-5 h-5 text-gray-400 shrink-0" />;
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ folderStack, onNavigate }) => (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
        <button
            onClick={() => onNavigate(-1)}
            className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400 hover:underline transition-transform active:scale-95"
        >
            <HardDrive className="w-3.5 h-3.5" />
            My Drive
        </button>
        {folderStack.map((folder, idx) => (
            <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <button
                    onClick={() => onNavigate(idx)}
                    className={clsx(
                        'font-medium hover:underline truncate max-w-[140px] transition-transform',
                        idx === folderStack.length - 1
                            ? 'text-gray-700 dark:text-gray-300 cursor-default pointer-events-none'
                            : 'text-teal-600 dark:text-teal-400 active:scale-95'
                    )}
                    title={folder.name}
                >
                    {folder.name}
                </button>
            </span>
        ))}
    </nav>
);

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────
const BulkActionBar = ({ count, accounts, sourceAccountId, onBulkAction, onClear, isVisible }) => {
    const targets = accounts.filter(a => String(a._id) !== String(sourceAccountId));
    return (
        <div className={clsx(
            'fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 min-w-[360px] border border-gray-700 dark:border-gray-300 transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] motion-reduce:translate-y-0',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        )}>
            <span className="font-semibold text-sm shrink-0">
                {count} file{count !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2 flex-1 flex-wrap">
                {targets.length === 0 && (
                    <span className="text-xs opacity-60">Link another account to transfer</span>
                )}
                {targets.map(acc => (
                    <div key={acc._id} className="flex items-center gap-1">
                        <button
                            onClick={() => onBulkAction('copy', acc._id, acc.email)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-teal-500 hover:text-white text-xs font-medium transition-all active:scale-[0.96]"
                            title={`Copy to ${acc.email}`}
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy → {acc.email.split('@')[0]}
                        </button>
                        <button
                            onClick={() => onBulkAction('move', acc._id, acc.email)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-red-500 hover:text-white text-xs font-medium transition-all active:scale-[0.96]"
                            title={`Move to ${acc.email}`}
                        >
                            <MoveRight className="w-3.5 h-3.5" />
                            Move → {acc.email.split('@')[0]}
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={onClear}
                className="p-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 transition-all active:scale-[0.9] shrink-0"
                title="Clear selection"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ─── Bulk Transfer Confirm Modal ──────────────────────────────────────────────
const BulkTransferModal = ({ count, action, targetEmail, onConfirm, onCancel, isTransferring }) => {
    const titleId = useId();
    const containerRef = useDialogA11y(true, isTransferring ? () => {} : onCancel);
    const reduceMotion = useReducedMotion();
    return (
    <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={!isTransferring ? onCancel : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 12 }}
            transition={DIALOG_SPRING}
        >
            <h3 id={titleId} className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {action === 'move' ? 'Move' : 'Copy'} {count} file{count !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {action === 'move'
                    ? 'These files will be removed from the source drive and added to '
                    : 'These files will be copied to '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{targetEmail}</span>.
                {action === 'move' && ' This cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onCancel}
                    disabled={isTransferring}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isTransferring}
                    className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2',
                        action === 'move' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
                    )}
                >
                    {isTransferring && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isTransferring ? 'Transferring…' : (action === 'move' ? 'Move Files' : 'Copy Files')}
                </button>
            </div>
        </motion.div>
    </motion.div>
    );
};

// ─── Folder Browser ───────────────────────────────────────────────────────────
const FolderBrowser = ({ account, accounts, onToast, onClose }) => {
    const { fetchFolderContents, deleteFile, bulkTransfer } = useDriveStore();

    const [folderStack, setFolderStack] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    // Plain object keeps React re-rendering reliably (Set reference mutations can be missed)
    const [selectedMap, setSelectedMap] = useState({});
    const [bulkPending, setBulkPending] = useState(null);
    const [isBulkTransferring, setIsBulkTransferring] = useState(false);
    const [deletePending, setDeletePending] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedIds = Object.keys(selectedMap);
    const selectedCount = selectedIds.length;
    const [showBulkBar, bulkBarVisible] = useDelayedUnmount(selectedCount > 0, 200);
    // Freeze the last non-zero count so the bar doesn't flash "0 files
    // selected" while it plays its exit transition after Clear/transfer.
    const lastSelectedCountRef = useRef(selectedCount);
    if (selectedCount > 0) lastSelectedCountRef.current = selectedCount;

    const loadFolder = useCallback(async (folderId) => {
        setLoading(true);
        setSelectedMap({});
        try {
            const data = await fetchFolderContents(account._id, folderId);
            setItems(data);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to load folder contents.';
            onToast('error', msg);
        } finally {
            setLoading(false);
        }
    }, [account._id, fetchFolderContents, onToast]);

    useEffect(() => { loadFolder('root'); }, []);

    const enterFolder = (folder) => {
        setFolderStack(prev => [...prev, { id: folder.id, name: folder.name }]);
        loadFolder(folder.id);
    };

    const navigateTo = (stackIdx) => {
        if (stackIdx === -1) {
            setFolderStack([]);
            loadFolder('root');
        } else {
            setFolderStack(prev => {
                const newStack = prev.slice(0, stackIdx + 1);
                loadFolder(newStack[newStack.length - 1].id);
                return newStack;
            });
        }
    };

    // Toggle a single file — clicking the row or the checkbox both work
    const toggleSelect = (e, fileId) => {
        e.stopPropagation();
        setSelectedMap(prev => {
            const next = { ...prev };
            if (next[fileId]) delete next[fileId];
            else next[fileId] = true;
            return next;
        });
    };

    const fileItems = items.filter(i => !i.isFolder);
    const folderItems = items.filter(i => i.isFolder);
    const allFilesSelected = fileItems.length > 0 && fileItems.every(f => !!selectedMap[f.id]);

    const toggleSelectAll = (e) => {
        e.stopPropagation();
        if (allFilesSelected) {
            setSelectedMap({});
        } else {
            const next = {};
            fileItems.forEach(f => { next[f.id] = true; });
            setSelectedMap(next);
        }
    };

    const handleDelete = (e, item) => {
        e.stopPropagation();
        setDeletePending(item);
    };

    const confirmDelete = async () => {
        if (!deletePending) return;
        const item = deletePending;
        setIsDeleting(true);
        try {
            await deleteFile(account._id, item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            setSelectedMap(prev => { const n = { ...prev }; delete n[item.id]; return n; });
            onToast('success', `"${item.name}" deleted.`);
        } catch {
            onToast('error', 'Failed to delete file.');
        } finally {
            setIsDeleting(false);
            setDeletePending(null);
        }
    };

    const handleBulkAction = (action, targetAccountId, targetEmail) =>
        setBulkPending({ action, targetAccountId, targetEmail });

    const confirmBulkTransfer = async () => {
        if (!bulkPending) return;
        setIsBulkTransferring(true);
        try {
            const result = await bulkTransfer({
                sourceAccountId: account._id,
                targetAccountId: bulkPending.targetAccountId,
                fileIds: selectedIds,
                action: bulkPending.action,
            });
            const successCount = result.succeeded?.length ?? 0;
            const failCount = result.failed?.length ?? 0;
            if (successCount > 0) {
                onToast('success', `${successCount} file${successCount !== 1 ? 's' : ''} ${bulkPending.action === 'move' ? 'moved' : 'copied'} to ${bulkPending.targetEmail} ✓`);
                if (bulkPending.action === 'move') {
                    const movedSet = new Set(selectedIds);
                    setItems(prev => prev.filter(i => !movedSet.has(i.id)));
                }
                setSelectedMap({});
            }
            if (failCount > 0)
                onToast('error', `${failCount} file${failCount !== 1 ? 's' : ''} failed to transfer.`);
        } catch (err) {
            onToast('error', err?.response?.data?.message || 'Bulk transfer failed.');
        } finally {
            setIsBulkTransferring(false);
            setBulkPending(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <FolderOpen className="w-4 h-4 text-teal-500 shrink-0" />
                    <Breadcrumb folderStack={folderStack} onNavigate={navigateTo} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{account.email}</span>
                    <button onClick={onClose} aria-label="Close folder browser" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all active:scale-[0.9]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
                    <span className="text-sm">Loading…</span>
                </div>
            ) : items.length === 0 ? (
                <div className="p-10 text-center">
                    <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">This folder is empty</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {fileItems.length > 0 && (
                                            <button
                                                onClick={toggleSelectAll}
                                                aria-label={allFilesSelected ? 'Deselect all files' : 'Select all files'}
                                                aria-pressed={allFilesSelected}
                                                className="text-gray-400 hover:text-teal-500 transition-all active:scale-90 shrink-0"
                                            >
                                                {allFilesSelected
                                                    ? <CheckSquare className="w-4 h-4 text-teal-500" />
                                                    : <Square className="w-4 h-4" />
                                                }
                                            </button>
                                        )}
                                        <span>Name</span>
                                    </div>
                                </th>
                                <th className="px-3 py-3 hidden sm:table-cell">Size</th>
                                <th className="px-3 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Folders — clicking enters the folder */}
                            {folderItems.map(folder => (
                                <tr
                                    key={folder.id}
                                    className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer group"
                                    onClick={() => enterFolder(folder)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            {/* Spacer aligns with file checkboxes */}
                                            <span className="w-4 shrink-0" />
                                            <FileIcon mimeType={folder.mimeType} isFolder />
                                            <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 truncate max-w-xs">
                                                {folder.name}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-400 shrink-0" />
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 hidden sm:table-cell text-gray-400 text-xs">Folder</td>
                                    <td className="px-3 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={folder.webViewLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-teal-600 rounded-lg transition-colors"
                                                title="Open in Drive"
                                                aria-label={`Open "${folder.name}" in Drive`}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Files — clicking the row toggles selection */}
                            {fileItems.map(file => {
                                const isSelected = !!selectedMap[file.id];
                                return (
                                    <tr
                                        key={file.id}
                                        onClick={(e) => toggleSelect(e, file.id)}
                                        className={clsx(
                                            'transition-colors group cursor-pointer select-none',
                                            isSelected
                                                ? 'bg-teal-50 dark:bg-teal-900/20'
                                                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                                        )}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                {/* Checkbox inline before icon and name */}
                                                <span className="shrink-0 text-gray-400">
                                                    {isSelected
                                                        ? <CheckSquare className="w-4 h-4 text-teal-500" />
                                                        : <Square className="w-4 h-4" />
                                                    }
                                                </span>
                                                <FileIcon mimeType={file.mimeType} />
                                                <a
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="font-medium text-gray-800 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:underline truncate max-w-xs block"
                                                >
                                                    {file.name}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 hidden sm:table-cell text-gray-500 dark:text-gray-400 text-xs">
                                            {file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : '—'}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors"
                                                    title="Open in Drive"
                                                    aria-label={`Open "${file.name}" in Drive`}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                    onClick={(e) => handleDelete(e, file)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all active:scale-[0.9]"
                                                    title="Delete"
                                                    aria-label={`Delete "${file.name}"`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bulk action bar (fixed bottom) */}
            {showBulkBar && (
                <BulkActionBar
                    count={lastSelectedCountRef.current}
                    accounts={accounts}
                    sourceAccountId={account._id}
                    onBulkAction={handleBulkAction}
                    onClear={() => setSelectedMap({})}
                    isVisible={bulkBarVisible}
                />
            )}

            {/* Delete confirm dialog */}
            <ConfirmDialog
                isOpen={!!deletePending}
                title="Delete file"
                message={`Delete "${deletePending?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeletePending(null)}
            />

            {/* Bulk confirm modal */}
            <AnimatePresence>
                {bulkPending && (
                    <BulkTransferModal
                        key="bulk-transfer-modal"
                        count={selectedCount}
                        action={bulkPending.action}
                        targetEmail={bulkPending.targetEmail}
                        onConfirm={confirmBulkTransfer}
                        onCancel={() => setBulkPending(null)}
                        isTransferring={isBulkTransferring}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Image Preview Modal (lightbox) ─────────────────────────────────────────
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
const isImageMime = (mime) => IMAGE_MIMES.some(m => mime?.startsWith(m.replace(/\/.*/, '/')) || mime === m);

const ImagePreviewModal = ({ file, onClose }) => {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const titleId = useId();
    const containerRef = useDialogA11y(!!file, onClose);

    useEffect(() => {
        if (!file) return;
        setLoading(true); setError(null); setSrc(null);
        const token = localStorage.getItem('token');
        const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        fetch(
            `${backendBase}/api/drive/preview?accountId=${file.accountId}&fileId=${file.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then(async r => {
                if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
                const blob = await r.blob();
                setSrc(URL.createObjectURL(blob));
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));

        return () => { if (src) URL.revokeObjectURL(src); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file?.id]);

    const reduceMotion = useReducedMotion();

    if (!file) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                transition={DIALOG_SPRING}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-3 px-1">
                    <span id={titleId} className="text-white font-medium truncate max-w-[80%]" title={file.name}>
                        {file.name}
                    </span>
                    <div className="flex items-center gap-2">
                        <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-white text-sm flex items-center gap-1 transition-colors"
                            title="Open in Drive"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open in Drive
                        </a>
                        <button
                            onClick={onClose}
                            aria-label="Close preview"
                            className="ml-2 text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Image area */}
                <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center w-full" style={{ maxHeight: '80vh' }}>
                    {loading && (
                        <div className="flex flex-col items-center gap-3 p-16 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-sm">Loading preview…</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center gap-3 p-16 text-red-400">
                            <AlertCircle className="w-8 h-8" />
                            <span className="text-sm">Failed to load: {error}</span>
                        </div>
                    )}
                    {src && (
                        <img
                            src={src}
                            alt={file.name}
                            className="max-w-full max-h-[78vh] object-contain rounded-xl"
                        />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};


const DraggableFileRow = ({ file, onDelete, hideAccount, onPreview, onFolderOpen }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `file-${file.id}-${file.accountId}`,
        data: { file },
    });

    const canPreview = isImageMime(file.mimeType);

    return (
        <tr
            ref={setNodeRef}
            className={clsx(
                'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group',
                isDragging && 'opacity-40 bg-teal-50/50 dark:bg-teal-900/10'
            )}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    {/* Pointer-only drag handle (no keyboard equivalent) — hidden from
                        assistive tech since it exposes no operable affordance without a
                        mouse. Keyboard/screen-reader users transfer files via the bulk
                        Copy/Move buttons in the folder browser's selection bar instead. */}
                    <div
                        {...listeners}
                        {...attributes}
                        aria-hidden="true"
                        className="text-gray-300 dark:text-gray-600 hover:text-teal-400 cursor-grab active:cursor-grabbing transition-colors shrink-0"
                        title="Drag to transfer to another account"
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <FileIcon mimeType={file.mimeType} isFolder={file.isFolder} />
                    {file.isFolder ? (
                        <button
                            onClick={() => onFolderOpen && onFolderOpen(file)}
                            className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 hover:underline truncate max-w-xs text-left"
                        >
                            {file.name}
                        </button>
                    ) : (
                        <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 hover:underline truncate max-w-xs block"
                        >
                            {file.name}
                        </a>
                    )}
                    {file.isFolder && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-medium">
                            Folder
                        </span>
                    )}
                </div>
            </td>
            {!hideAccount && (
                <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <img
                            src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
                            alt="" className="w-4 h-4 opacity-75"
                        />
                        <span className="truncate max-w-[150px]" title={file.accountEmail}>{file.accountEmail}</span>
                    </div>
                </td>
            )}
            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                {file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : '—'}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.isFolder && (
                        <button
                            onClick={() => onFolderOpen && onFolderOpen(file)}
                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all active:scale-[0.9]"
                            title="Open folder"
                            aria-label={`Open folder "${file.name}"`}
                        >
                            <FolderOpen className="w-4 h-4" />
                        </button>
                    )}
                    {canPreview && (
                        <button
                            onClick={() => onPreview(file)}
                            className="p-2 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-all active:scale-[0.9]"
                            title="Preview image"
                            aria-label={`Preview "${file.name}"`}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    )}
                    <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors"
                        title="Open in Drive"
                        aria-label={`Open "${file.name}" in Drive`}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    {!file.isFolder && (
                        <button
                            onClick={() => onDelete(file)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all active:scale-[0.9]"
                            title="Delete"
                            aria-label={`Delete "${file.name}"`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};


// ─── Droppable Account Card ───────────────────────────────────────────────────
const DroppableAccountCard = ({ account, onUnlink, onUpload, isUploading, isTransferring, onBrowse, isBrowsing }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuId = useId();
    const reduceMotion = useReducedMotion();
    const { setNodeRef, isOver } = useDroppable({ id: `account-${account._id}`, data: { account } });

    // Real OS-file drag-and-drop upload, in addition to the dnd-kit cross-account
    // transfer above. These are separate event systems (native drag events vs.
    // pointer-based dnd-kit) so they coexist on the same card without conflict.
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => { if (acceptedFiles.length) onUpload(acceptedFiles, account._id); },
        noClick: true,
        noKeyboard: true,
        disabled: isUploading || isTransferring,
    });

    const { ref: dropzoneRef, ...dropzoneRootProps } = getRootProps();

    return (
        <motion.div
            {...dropzoneRootProps}
            ref={(node) => { setNodeRef(node); dropzoneRef(node); }}
            className={clsx(
                'group bg-white dark:bg-gray-900 p-5 rounded-xl border transition-colors relative',
                isOver
                    ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-900/20 ring-2 ring-teal-400/40 shadow-lg'
                    : isDragActive
                        ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-900/20 ring-2 ring-cyan-400/40 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
            )}
            animate={{ scale: !reduceMotion && (isOver || isDragActive) ? 1.02 : 1 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
        >
            <input {...getInputProps()} />
            {isOver && (
                <div className="absolute inset-0 bg-teal-50/80 dark:bg-teal-900/60 rounded-xl z-20 flex flex-col items-center justify-center text-teal-600 dark:text-teal-300 font-medium backdrop-blur-sm pointer-events-none">
                    <ArrowLeftRight className="w-7 h-7 mb-2 animate-pulse" />
                    <span>Transfer here</span>
                    <span className="text-xs opacity-75 mt-1">{account.email}</span>
                </div>
            )}
            {isDragActive && !isOver && (
                <div className="absolute inset-0 bg-cyan-50/80 dark:bg-cyan-900/60 rounded-xl z-20 flex flex-col items-center justify-center text-cyan-700 dark:text-cyan-300 font-medium backdrop-blur-sm pointer-events-none">
                    <Upload className="w-7 h-7 mb-2 animate-bounce" />
                    <span>Drop to upload</span>
                    <span className="text-xs opacity-75 mt-1">{account.email}</span>
                </div>
            )}

            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[160px]" title={account.email}>
                            {account.email}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-medium mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                        </span>
                    </div>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label={`Options for ${account.email}`}
                        aria-haspopup="menu"
                        aria-expanded={showMenu}
                        aria-controls={menuId}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all active:scale-[0.9]"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div id={menuId} role="menu" className="absolute right-0 top-full mt-2 w-48 origin-top-right bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1 animate-menu-in">
                                <button
                                    role="menuitem"
                                    onClick={() => { onUnlink(account._id); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40 flex items-center gap-2"
                                >
                                    <Unlink className="w-4 h-4" />
                                    Unlink Account
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3 h-3" />
                Drop files here to upload, or drag rows below to transfer
            </p>

            <div className="mt-2 flex gap-2">
                <label className={clsx(
                    'flex-1 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 rounded-lg p-3 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all relative z-10',
                    (isUploading || isTransferring) && 'opacity-50 cursor-not-allowed'
                )}>
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading…' : 'Upload'}
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.length) onUpload(Array.from(e.target.files), account._id); e.target.value = ''; }}
                        disabled={isUploading || isTransferring}
                    />
                </label>
                <button
                    onClick={onBrowse}
                    className={clsx(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] border relative z-10',
                        isBrowsing
                            ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400'
                    )}
                >
                    <FolderOpen className="w-4 h-4" />
                    Browse
                </button>
            </div>
        </motion.div>
    );
};

// ─── Complete View Row (read-only, no drag) ───────────────────────────────────
const CompleteViewRow = ({ item, onPreview }) => {
    const canPreview = isImageMime(item.mimeType);
    return (
        <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <FileIcon mimeType={item.mimeType} isFolder={item.isFolder} />
                    <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 hover:underline truncate max-w-xs block"
                    >
                        {item.name}
                    </a>
                    {item.isFolder && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-medium shrink-0">
                            Folder
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 hidden md:table-cell">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <img
                        src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
                        alt="" className="w-4 h-4 opacity-75"
                    />
                    <span className="truncate max-w-[150px]" title={item.accountEmail}>{item.accountEmail}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                {item.size ? (parseInt(item.size) / 1024 / 1024).toFixed(2) + ' MB' : '—'}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canPreview && (
                        <button
                            onClick={() => onPreview(item)}
                            className="p-2 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors"
                            title="Preview image"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    )}
                    <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors"
                        title="Open in Drive"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </td>
        </tr>
    );
};


// ─── Recent Files Section ─────────────────────────────────────────────────────
// viewMode: 'merged' | 'complete' | accountId string
const RecentFilesSection = ({ files, accounts, isLoading, onDelete }) => {
    const { fetchCompleteView } = useDriveStore();
    const [viewMode, setViewMode] = useState('merged');
    const [completeItems, setCompleteItems] = useState([]);
    const [completeLoading, setCompleteLoading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    const loadCompleteView = async () => {
        setCompleteLoading(true);
        try {
            const data = await fetchCompleteView(accounts);
            setCompleteItems(data);
        } catch {
            // silently fail; items stays empty
        } finally {
            setCompleteLoading(false);
        }
    };

    const handleTabChange = (mode) => {
        setViewMode(mode);
        if (mode === 'complete' && completeItems.length === 0) {
            loadCompleteView();
        }
    };

    // Files to show depending on active tab
    const displayFiles = viewMode === 'merged'
        ? files
        : viewMode === 'complete'
            ? completeItems
            : files.filter(f => String(f.accountId) === viewMode);

    const viewAccount = accounts.find(a => a._id === viewMode);
    const isComplete = viewMode === 'complete';

    return (
        <>
            <AnimatePresence>
                {previewFile && <ImagePreviewModal key="image-preview" file={previewFile} onClose={() => setPreviewFile(null)} />}
            </AnimatePresence>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Recent Files
                    </h2>

                    {/* View toggle tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex-wrap">
                        <button
                            onClick={() => handleTabChange('merged')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.96]',
                                viewMode === 'merged'
                                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Merged
                        </button>
                        <button
                            onClick={() => handleTabChange('complete')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.96]',
                                viewMode === 'complete'
                                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            )}
                            title="Every file and folder in all your drives"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Complete
                        </button>
                        {accounts.map(acc => (
                            <button
                                key={acc._id}
                                onClick={() => handleTabChange(acc._id)}
                                title={acc.email}
                                className={clsx(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.96] max-w-[140px]',
                                    viewMode === acc._id
                                        ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                )}
                            >
                                <LayoutList className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{acc.email.split('@')[0]}</span>
                            </button>
                        ))}
                    </div>


                    <div className="flex items-center gap-2">
                        {accounts.length > 1 && viewMode === 'merged' && (
                            <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <ArrowLeftRight className="w-3 h-3" />
                                Drag rows to transfer
                            </span>
                        )}
                        {isComplete && (
                            <button
                                onClick={loadCompleteView}
                                disabled={completeLoading}
                                className="text-xs text-teal-600 dark:text-teal-400 hover:underline transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {completeLoading ? 'Refreshing…' : 'Refresh'}
                            </button>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {displayFiles.length} item{displayFiles.length !== 1 ? 's' : ''}
                            {viewAccount ? ` from ${viewAccount.email.split('@')[0]}` : ''}
                        </span>
                    </div>
                </div>

                {/* Body */}
                {(isLoading && !isComplete) || (isComplete && completeLoading) ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {isComplete ? 'Loading all items…' : 'Syncing files…'}
                        </p>
                    </div>
                ) : displayFiles.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <File className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {isComplete ? 'Nothing in root folder' : viewMode === 'merged' ? 'No files found' : 'No files from this account'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {isComplete ? 'Your drives root folders are empty.' : 'Upload a file or link a drive to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    {(viewMode === 'merged' || viewMode === 'complete') && (
                                        <th className="px-6 py-4 hidden md:table-cell">Drive Account</th>
                                    )}
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {isComplete
                                    ? displayFiles.map(item => (
                                        <CompleteViewRow key={`${item.id}-${item.accountId}`} item={item} onPreview={setPreviewFile} />
                                    ))
                                    : displayFiles.map(file => (
                                        <DraggableFileRow
                                            key={`${file.id}-${file.accountId}`}
                                            file={file}
                                            onDelete={onDelete}
                                            onPreview={setPreviewFile}
                                            hideAccount={viewMode !== 'merged'}
                                        />
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};


// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const {
        accounts, files, fetchAccounts, fetchFiles,
        getAuthUrl, uploadFile, deleteFile, unlinkAccount, transferFile, isLoading,
    } = useDriveStore();

    const [isUploading, setIsUploading] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [activeDragFile, setActiveDragFile] = useState(null);
    const [pendingTransfer, setPendingTransfer] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [transferProgress, setTransferProgress] = useState(null);
    const [browsingAccountId, setBrowsingAccountId] = useState(null);
    const [unlinkPending, setUnlinkPending] = useState(null); // accountId
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [deletePending, setDeletePending] = useState(null); // file
    const [isDeletingFile, setIsDeletingFile] = useState(false);

    const reduceMotion = useReducedMotion();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Tracks release speed (px/ms) over the last drag-move sample so the
    // DragOverlay's drop-settle animation can react to it — a fast flick
    // settles quicker/snappier than a slow, deliberate drop, instead of one
    // fixed duration for every release. See handleDragMove / dropAnimation.
    const dragVelocityRef = useRef(0);
    const lastDragSampleRef = useRef(null);

    useEffect(() => {
        fetchAccounts();
        fetchFiles();
    }, []);

    // Matches index.css's --dur-fast — the toast plays its exit transition
    // before actually leaving the `toasts` array.
    const TOAST_EXIT_MS = 200;
    const removeToast = (id) => {
        setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_EXIT_MS);
    };
    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message, leaving: false }]);
        setTimeout(() => removeToast(id), 5000);
    };
    const dismissToast = (id) => removeToast(id);

    const handleLinkAccount = async () => {
        const url = await getAuthUrl();
        if (url) window.location.href = url;
    };

    const handleUnlink = (accountId) => setUnlinkPending(accountId);

    const confirmUnlink = async () => {
        if (!unlinkPending) return;
        setIsUnlinking(true);
        try {
            await unlinkAccount(unlinkPending);
            if (browsingAccountId === unlinkPending) setBrowsingAccountId(null);
        } catch {
            addToast('error', 'Failed to unlink account.');
        } finally {
            setIsUnlinking(false);
            setUnlinkPending(null);
        }
    };

    // accepts a single File or an array (multi-file drag/drop or picker selection)
    const handleUpload = async (fileOrFiles, accountId) => {
        const uploadList = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
        setIsUploading(true);
        for (const file of uploadList) {
            try {
                await uploadFile(file, accountId);
                addToast('success', `"${file.name}" uploaded successfully.`);
            } catch {
                addToast('error', `Failed to upload "${file.name}".`);
            }
        }
        setIsUploading(false);
    };

    const handleDelete = (file) => setDeletePending(file);

    const confirmDeleteFile = async () => {
        if (!deletePending) return;
        const file = deletePending;
        setIsDeletingFile(true);
        try {
            await deleteFile(file.accountId, file.id);
        } catch {
            addToast('error', 'Failed to delete file.');
        } finally {
            setIsDeletingFile(false);
            setDeletePending(null);
        }
    };

    const handleDragStart = ({ active }) => {
        setActiveDragFile(active.data.current?.file || null);
        dragVelocityRef.current = 0;
        lastDragSampleRef.current = null;
    };

    const handleDragMove = ({ delta }) => {
        const now = performance.now();
        const last = lastDragSampleRef.current;
        if (last) {
            const dt = now - last.t;
            if (dt > 4) { // ignore samples too close together to be reliable
                const dist = Math.hypot(delta.x - last.x, delta.y - last.y);
                dragVelocityRef.current = dist / dt; // px/ms
                lastDragSampleRef.current = { x: delta.x, y: delta.y, t: now };
            }
        } else {
            lastDragSampleRef.current = { x: delta.x, y: delta.y, t: now };
        }
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveDragFile(null);
        if (!over || !active.data.current?.file) return;
        const draggedFile = active.data.current.file;
        const targetAccount = over.data.current?.account;
        if (!targetAccount) return;
        if (String(draggedFile.accountId) === String(targetAccount._id)) return;
        setPendingTransfer({ file: draggedFile, targetAccount });
    };

    const handleTransferConfirm = async (action) => {
        if (!pendingTransfer) return;
        const { file, targetAccount } = pendingTransfer;
        setIsTransferring(true);
        setTransferProgress('active');
        try {
            const result = await transferFile({
                sourceAccountId: file.accountId,
                targetAccountId: targetAccount._id,
                fileId: file.id,
                action,
            });
            setPendingTransfer(null);
            addToast('success', `"${result.fileName}" ${action === 'move' ? 'moved' : 'copied'} to ${targetAccount.email} ✓`);
        } catch (err) {
            addToast('error', err.response?.data?.message || `Failed to ${action} file.`);
        } finally {
            setIsTransferring(false);
            setTransferProgress(null);
            if (!isTransferring) setPendingTransfer(null);
        }
    };

    const handleTransferCancel = () => { if (!isTransferring) setPendingTransfer(null); };

    const browsingAccount = accounts.find(a => a._id === browsingAccountId) || null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {transferProgress === 'active' && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full w-1/3 bg-teal-500 rounded-full animate-indeterminate" />
                </div>
            )}

            <Toast toasts={toasts} onDismiss={dismissToast} />

            <AnimatePresence>
                {pendingTransfer && (
                    <TransferModal
                        key="transfer-modal"
                        file={pendingTransfer.file}
                        targetAccount={pendingTransfer.targetAccount}
                        onConfirm={handleTransferConfirm}
                        onCancel={handleTransferCancel}
                        isTransferring={isTransferring}
                    />
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={!!unlinkPending}
                title="Unlink drive"
                message="Are you sure you want to unlink this drive? You can re-link it later, but any in-progress transfers to it will fail."
                confirmLabel="Unlink"
                isLoading={isUnlinking}
                onConfirm={confirmUnlink}
                onCancel={() => setUnlinkPending(null)}
            />

            <ConfirmDialog
                isOpen={!!deletePending}
                title="Delete file"
                message={`Delete "${deletePending?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                isLoading={isDeletingFile}
                onConfirm={confirmDeleteFile}
                onCancel={() => setDeletePending(null)}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Drives</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {accounts.length} connected account{accounts.length !== 1 ? 's' : ''} · Drag files between accounts to transfer
                    </p>
                </div>
                <button
                    onClick={handleLinkAccount}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all active:scale-[0.97] shadow-sm bg-teal-600 hover:bg-teal-700 text-white"
                >
                    <Plus className="w-5 h-5" />
                    Link New Drive
                </button>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
                {/* Account Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map(acc => (
                        <DroppableAccountCard
                            key={acc._id}
                            account={acc}
                            onUnlink={handleUnlink}
                            onUpload={handleUpload}
                            isUploading={isUploading}
                            isTransferring={isTransferring}
                            isBrowsing={browsingAccountId === acc._id}
                            onBrowse={() => setBrowsingAccountId(prev => prev === acc._id ? null : acc._id)}
                        />
                    ))}

                    <div
                        onClick={handleLinkAccount}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.99] group min-h-[200px]"
                    >
                        <div className="bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 p-3 rounded-full mb-3 transition-colors">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-teal-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">Connect Another Account</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add more Google Drive storage</p>
                    </div>
                </div>

                {/* Folder Browser (shown when a drive card is Browse-clicked) */}
                {browsingAccount && (
                    <FolderBrowser
                        key={browsingAccount._id}
                        account={browsingAccount}
                        accounts={accounts}
                        onToast={addToast}
                        onClose={() => setBrowsingAccountId(null)}
                    />
                )}

                <DragOverlay
                    dropAnimation={{
                        ...defaultDropAnimationConfiguration,
                        // Faster release -> shorter, snappier settle (min 120ms);
                        // a slow, deliberate drop keeps dnd-kit's normal 250ms.
                        // Carries release velocity into the settle instead of one
                        // fixed duration for every drop (apple-design skill §5).
                        duration: reduceMotion ? 0 : Math.max(120, Math.min(250, 250 - dragVelocityRef.current * 60)),
                    }}
                >
                    {activeDragFile && (
                        <div className="bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-600 rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300 opacity-95">
                            <ArrowLeftRight className="w-4 h-4" />
                            {activeDragFile.name}
                        </div>
                    )}
                </DragOverlay>

                <RecentFilesSection
                    files={files}
                    accounts={accounts}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                />
            </DndContext>
        </div>
    );
};

export default Dashboard;
