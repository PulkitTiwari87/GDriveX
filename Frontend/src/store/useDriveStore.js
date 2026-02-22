import { create } from 'zustand';
import api from '../lib/axios';

const useDriveStore = create((set) => ({
    accounts: [],
    files: [],
    analytics: [],
    isLoading: false,
    error: null,

    fetchAccounts: async () => {
        try {
            const { data } = await api.get('/drive/accounts');
            set({ accounts: data });
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    },

    fetchFiles: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/drive/files');
            set({ files: data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch files', isLoading: false });
        }
    },

    fetchFolderContents: async (accountId, folderId = 'root') => {
        const { data } = await api.get('/drive/folder-contents', {
            params: { accountId, folderId },
        });
        return data; // array of { id, name, mimeType, isFolder, size, ... }
    },

    // Fetch EVERYTHING (all files + folders) from all accounts' entire drives
    fetchCompleteView: async (accounts) => {
        const results = await Promise.allSettled(
            accounts.map(acc =>
                api.get('/drive/all-contents', { params: { accountId: acc._id } })
                    .then(r => r.data.map(item => ({ ...item, accountEmail: acc.email })))
            )
        );
        const all = results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);
        // Sort folders first, then alphabetically
        all.sort((a, b) => {
            if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        return all;
    },

    fetchAnalytics: async () => {
        try {
            const { data } = await api.get('/drive/analytics');
            set({ analytics: data });
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    },

    getAuthUrl: async () => {
        try {
            const { data } = await api.get('/drive/auth-url');
            return data.url;
        } catch (error) {
            console.error('Failed to get auth url', error);
            return null;
        }
    },

    uploadFile: async (file, accountId, folderId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('accountId', accountId);
        if (folderId && folderId !== 'root') formData.append('folderId', folderId);
        try {
            const { data } = await api.post('/drive/upload', formData);
            const newFile = { ...data, accountId, createdTime: new Date().toISOString() };
            set(state => ({ files: [newFile, ...state.files] }));
            return data;
        } catch (error) {
            console.error('Upload failed', error);
            throw error;
        }
    },

    deleteFile: async (accountId, fileId) => {
        try {
            await api.delete(`/drive/${accountId}/${fileId}`);
            set(state => ({
                files: state.files.filter(f => f.id !== fileId)
            }));
        } catch (error) {
            console.error('Delete failed', error);
            throw error;
        }
    },

    // Cross-account single file transfer (copy or move via server-side streaming)
    transferFile: async ({ sourceAccountId, targetAccountId, fileId, action }) => {
        const { data } = await api.post('/drive/transfer', {
            sourceAccountId,
            targetAccountId,
            fileId,
            action,
        });
        if (action === 'move') {
            set(state => ({
                files: state.files.filter(
                    f => !(f.id === fileId && String(f.accountId) === String(sourceAccountId))
                ),
            }));
        }
        return data;
    },

    // Cross-account bulk transfer
    bulkTransfer: async ({ sourceAccountId, targetAccountId, fileIds, action }) => {
        const { data } = await api.post('/drive/transfer-bulk', {
            sourceAccountId,
            targetAccountId,
            fileIds,
            action,
        });
        if (action === 'move') {
            const movedIds = new Set(fileIds);
            set(state => ({
                files: state.files.filter(
                    f => !(movedIds.has(f.id) && String(f.accountId) === String(sourceAccountId))
                ),
            }));
        }
        return data;
    },

    unlinkAccount: async (accountId) => {
        try {
            await api.delete(`/drive/accounts/${accountId}`);
            set(state => ({
                accounts: state.accounts.filter(a => a._id !== accountId),
                files: state.files.filter(f => f.accountId !== accountId)
            }));
        } catch (error) {
            console.error('Unlink failed', error);
            throw error;
        }
    },
}));

export default useDriveStore;
