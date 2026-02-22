import { useState, useCallback, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core';
import useDriveStore from '../store/useDriveStore';
import TransferModal from '../components/TransferModal';
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
            <div
                key={t.id}
                className={clsx(
                    'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[280px] max-w-sm',
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
                <button onClick={() => onDismiss(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">
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
            className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
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
                        'font-medium hover:underline truncate max-w-[140px]',
                        idx === folderStack.length - 1
                            ? 'text-gray-700 dark:text-gray-300 cursor-default pointer-events-none'
                            : 'text-indigo-600 dark:text-indigo-400'
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
const BulkActionBar = ({ count, accounts, sourceAccountId, onBulkAction, onClear }) => {
    const targets = accounts.filter(a => String(a._id) !== String(sourceAccountId));
    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 min-w-[360px] border border-gray-700 dark:border-gray-300">
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-indigo-500 hover:text-white text-xs font-medium transition-colors"
                            title={`Copy to ${acc.email}`}
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy → {acc.email.split('@')[0]}
                        </button>
                        <button
                            onClick={() => onBulkAction('move', acc._id, acc.email)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-red-500 hover:text-white text-xs font-medium transition-colors"
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
                className="p-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 transition-colors shrink-0"
                title="Clear selection"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ─── Bulk Transfer Confirm Modal ──────────────────────────────────────────────
const BulkTransferModal = ({ count, action, targetEmail, onConfirm, onCancel, isTransferring }) => (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
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
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isTransferring}
                    className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2',
                        action === 'move' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    )}
                >
                    {isTransferring && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isTransferring ? 'Transferring…' : (action === 'move' ? 'Move Files' : 'Copy Files')}
                </button>
            </div>
        </div>
    </div>
);

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

    const selectedIds = Object.keys(selectedMap);
    const selectedCount = selectedIds.length;

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

    const handleDelete = async (e, item) => {
        e.stopPropagation();
        if (!confirm(`Delete "${item.name}"?`)) return;
        try {
            await deleteFile(account._id, item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            setSelectedMap(prev => { const n = { ...prev }; delete n[item.id]; return n; });
            onToast('success', `"${item.name}" deleted.`);
        } catch {
            onToast('error', 'Failed to delete file.');
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
                    <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <Breadcrumb folderStack={folderStack} onNavigate={navigateTo} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{account.email}</span>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
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
                        <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase text-gray-500 dark:text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {fileItems.length > 0 && (
                                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-indigo-500 transition-colors shrink-0">
                                                {allFilesSelected
                                                    ? <CheckSquare className="w-4 h-4 text-indigo-500" />
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
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                title="Open in Drive"
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
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                                        )}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                {/* Checkbox inline before icon and name */}
                                                <span className="shrink-0 text-gray-400">
                                                    {isSelected
                                                        ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                                                        : <Square className="w-4 h-4" />
                                                    }
                                                </span>
                                                <FileIcon mimeType={file.mimeType} />
                                                <a
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate max-w-xs block"
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
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                                                    title="Open in Drive"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                    onClick={(e) => handleDelete(e, file)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                                    title="Delete"
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
            {selectedCount > 0 && (
                <BulkActionBar
                    count={selectedCount}
                    accounts={accounts}
                    sourceAccountId={account._id}
                    onBulkAction={handleBulkAction}
                    onClear={() => setSelectedMap({})}
                />
            )}

            {/* Bulk confirm modal */}
            {bulkPending && (
                <BulkTransferModal
                    count={selectedCount}
                    action={bulkPending.action}
                    targetEmail={bulkPending.targetEmail}
                    onConfirm={confirmBulkTransfer}
                    onCancel={() => setBulkPending(null)}
                    isTransferring={isBulkTransferring}
                />
            )}
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

    useEffect(() => {
        if (!file) return;
        setLoading(true); setError(null); setSrc(null);
        const token = localStorage.getItem('token');
        const backendBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
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

    // Close on Escape
    useEffect(() => {
        const handler = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!file) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-3 px-1">
                    <span className="text-white font-medium truncate max-w-[80%]" title={file.name}>
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
                            className="ml-2 text-gray-400 hover:text-white transition-colors p-1 rounded"
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
            </div>
        </div>
    );
};


// ─── Folder Explorer Modal (file-manager popup) ────────────────────────────────
const FolderExplorerModal = ({ folder, onClose }) => {
    const [stack, setStack] = useState([{ id: folder.id, name: folder.name }]);
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightbox, setLightbox] = useState(null); // file to preview full-screen

    const current = stack[stack.length - 1];

    // Fetch folder contents whenever current folder changes
    useEffect(() => {
        setLoading(true); setError(null);
        api.get('/drive/folder-contents', { params: { accountId: folder.accountId, folderId: current.id } })
            .then(r => setContents(r.data))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [current.id, folder.accountId]);

    // Escape key → close
    useEffect(() => {
        const h = e => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const enterFolder = (f) => setStack(prev => [...prev, { id: f.id, name: f.name }]);
    const navigateTo = (idx) => setStack(prev => prev.slice(0, idx + 1));

    // Sort: folders first, then files alphabetically
    const sorted = [...contents].sort((a, b) => {
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <>
            {lightbox && <ImagePreviewModal file={{ ...lightbox, accountId: folder.accountId }} onClose={() => setLightbox(null)} />}
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
                <div
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col"
                    style={{ maxHeight: '85vh' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 rounded-t-2xl">
                        <Folder className="w-5 h-5 text-amber-500 shrink-0" />

                        {/* Breadcrumb */}
                        <div className="flex items-center flex-wrap gap-1 flex-1 min-w-0 text-sm">
                            {stack.map((seg, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                    <button
                                        onClick={() => navigateTo(i)}
                                        className={i === stack.length - 1
                                            ? 'font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]'
                                            : 'text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[120px]'}
                                    >
                                        {seg.name}
                                    </button>
                                </span>
                            ))}
                        </div>

                        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{folder.accountEmail}</span>
                        <button onClick={onClose} className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-3">
                                <AlertCircle className="w-8 h-8" />
                                <span className="text-sm">{error}</span>
                            </div>
                        ) : sorted.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                                <Folder className="w-10 h-10 opacity-40" />
                                <span className="text-sm">This folder is empty</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {sorted.map(item => (
                                    <FolderExplorerItem
                                        key={item.id}
                                        item={item}
                                        accountId={folder.accountId}
                                        onEnterFolder={enterFolder}
                                        onPreview={setLightbox}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center gap-2">
                        <span>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
                        <span className="text-gray-200 dark:text-gray-700">·</span>
                        <span>{sorted.filter(i => i.isFolder).length} folder{sorted.filter(i => i.isFolder).length !== 1 ? 's' : ''}</span>
                        <span className="text-gray-200 dark:text-gray-700">·</span>
                        <span>{sorted.filter(i => !i.isFolder).length} file{sorted.filter(i => !i.isFolder).length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Folder Explorer Item (card inside the explorer grid) ─────────────────────
const FolderExplorerItem = ({ item, accountId, onEnterFolder, onPreview }) => {
    const [thumbSrc, setThumbSrc] = useState(null);
    const canPreview = isImageMime(item.mimeType);

    // Fetch thumbnail for images
    useEffect(() => {
        if (!canPreview) return;
        const token = localStorage.getItem('token');
        const base = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
        fetch(`${base}/api/drive/preview?accountId=${accountId}&fileId=${item.id}`,
            { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.blob() : null)
            .then(blob => blob && setThumbSrc(URL.createObjectURL(blob)))
            .catch(() => { });
        return () => { if (thumbSrc) URL.revokeObjectURL(thumbSrc); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id]);

    const handleClick = () => {
        if (item.isFolder) onEnterFolder(item);
        else if (canPreview) onPreview(item);
        else window.open(item.webViewLink, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all text-left w-full"
            title={item.name}
        >
            {/* Thumbnail or icon */}
            <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 relative">
                {thumbSrc ? (
                    <img src={thumbSrc} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <FileIcon mimeType={item.mimeType} isFolder={item.isFolder} />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors rounded-lg flex items-center justify-center">
                    {item.isFolder && (
                        <FolderOpen className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {canPreview && !item.isFolder && (
                        <ZoomIn className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            </div>

            {/* Name */}
            <span className="text-xs text-center text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium line-clamp-2 w-full leading-tight transition-colors">
                {item.name}
            </span>

            {/* Size badge */}
            {item.size && (
                <span className="text-[10px] text-gray-400">
                    {(parseInt(item.size) / 1024).toFixed(0)} KB
                </span>
            )}
        </button>
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
                isDragging && 'opacity-40 bg-indigo-50/50 dark:bg-indigo-900/10'
            )}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <div
                        {...listeners}
                        {...attributes}
                        className="text-gray-300 dark:text-gray-600 hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-colors shrink-0"
                        title="Drag to transfer to another account"
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <FileIcon mimeType={file.mimeType} isFolder={file.isFolder} />
                    {file.isFolder ? (
                        <button
                            onClick={() => onFolderOpen && onFolderOpen(file)}
                            className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 hover:underline truncate max-w-xs text-left"
                        >
                            {file.name}
                        </button>
                    ) : (
                        <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 hover:underline truncate max-w-xs block"
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
                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors"
                            title="Open folder"
                        >
                            <FolderOpen className="w-4 h-4" />
                        </button>
                    )}
                    {canPreview && (
                        <button
                            onClick={() => onPreview(file)}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                            title="Preview image"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    )}
                    <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                        title="Open in Drive"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    {!file.isFolder && (
                        <button
                            onClick={() => onDelete(file)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Delete"
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
    const { setNodeRef, isOver } = useDroppable({ id: `account-${account._id}`, data: { account } });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                'group bg-white dark:bg-gray-900 p-5 rounded-xl border transition-all relative',
                isOver
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 ring-2 ring-indigo-400/40 shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
            )}
        >
            {isOver && (
                <div className="absolute inset-0 bg-indigo-50/80 dark:bg-indigo-900/60 rounded-xl z-20 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium backdrop-blur-sm pointer-events-none">
                    <ArrowLeftRight className="w-7 h-7 mb-2 animate-pulse" />
                    <span>Transfer here</span>
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
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1">
                                <button
                                    onClick={() => { onUnlink(account._id); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
                Drag files from the table below to transfer here
            </p>

            <div className="mt-2 flex gap-2">
                <label className={clsx(
                    'flex-1 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-blue-50/50 dark:hover:bg-indigo-900/20 rounded-lg p-3 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative z-10',
                    (isUploading || isTransferring) && 'opacity-50 cursor-not-allowed'
                )}>
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading…' : 'Upload'}
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0], account._id); }}
                        disabled={isUploading || isTransferring}
                    />
                </label>
                <button
                    onClick={onBrowse}
                    className={clsx(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border relative z-10',
                        isBrowsing
                            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                    )}
                >
                    <FolderOpen className="w-4 h-4" />
                    Browse
                </button>
            </div>
        </div>
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
                        className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 hover:underline truncate max-w-xs block"
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
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                            title="Preview image"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    )}
                    <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
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
            {previewFile && <ImagePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
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
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                viewMode === 'merged'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Merged
                        </button>
                        <button
                            onClick={() => handleTabChange('complete')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                viewMode === 'complete'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all max-w-[140px]',
                                    viewMode === acc._id
                                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <ArrowLeftRight className="w-3 h-3" />
                                Drag rows to transfer
                            </span>
                        )}
                        {isComplete && (
                            <button
                                onClick={loadCompleteView}
                                disabled={completeLoading}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
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
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
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
                            <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase text-gray-500 dark:text-gray-500 font-medium">
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

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    useEffect(() => {
        fetchAccounts();
        fetchFiles();
    }, []);

    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };
    const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const handleLinkAccount = async () => {
        const url = await getAuthUrl();
        if (url) window.location.href = url;
    };

    const handleUnlink = async (accountId) => {
        if (confirm('Are you sure you want to unlink this drive?')) {
            try {
                await unlinkAccount(accountId);
                if (browsingAccountId === accountId) setBrowsingAccountId(null);
            } catch {
                addToast('error', 'Failed to unlink account.');
            }
        }
    };

    const handleUpload = async (file, accountId) => {
        setIsUploading(true);
        try {
            await uploadFile(file, accountId);
            addToast('success', `"${file.name}" uploaded successfully.`);
        } catch {
            addToast('error', 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (file) => {
        if (confirm(`Delete "${file.name}"?`)) {
            try { await deleteFile(file.accountId, file.id); }
            catch { addToast('error', 'Failed to delete file.'); }
        }
    };

    const handleDragStart = ({ active }) => setActiveDragFile(active.data.current?.file || null);

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
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
                    <div className="h-full bg-indigo-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '70%' }} />
                </div>
            )}

            <Toast toasts={toasts} onDismiss={dismissToast} />

            {pendingTransfer && (
                <TransferModal
                    file={pendingTransfer.file}
                    targetAccount={pendingTransfer.targetAccount}
                    onConfirm={handleTransferConfirm}
                    onCancel={handleTransferCancel}
                    isTransferring={isTransferring}
                />
            )}

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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus className="w-5 h-5" />
                    Link New Drive
                </button>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all group min-h-[200px]"
                    >
                        <div className="bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 p-3 rounded-full mb-3 transition-colors">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
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

                <DragOverlay>
                    {activeDragFile && (
                        <div className="bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 opacity-95">
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
