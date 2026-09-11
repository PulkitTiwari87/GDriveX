import { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Camera } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Settings = () => {
    const { user, updateProfile, isUpdating, changePassword } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' }); // 'success' | 'error'
    const fileInputRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

    // Sync form when user data updates (e.g. on mount after fetchProfile)
    useEffect(() => {
        setName(user?.name || '');
        setBio(user?.bio || '');
    }, [user]);

    const currentAvatarUrl = user?.profilePicture
        ? `${BACKEND_URL}${user.profilePicture}`
        : null;

    const displayAvatar = previewUrl || currentAvatarUrl;
    const initials = user?.name?.[0]?.toUpperCase() || '?';

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('bio', bio);
            if (selectedFile) formData.append('profilePicture', selectedFile);
            await updateProfile(formData);
            setSelectedFile(null);    // clear pending file after successful upload
            setStatus({ type: 'success', message: 'Profile updated successfully!' });
        } catch {
            setStatus({ type: 'error', message: 'Failed to update profile. Please try again.' });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordStatus({ type: '', message: '' });

        if (newPassword.length < 8) {
            setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' });
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        } catch (error) {
            setPasswordStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to update password. Please try again.',
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar tabs */}
                <aside className="md:w-48 shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setStatus({ type: '', message: '' }); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === tab.id
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content Panel */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">

                    {/* Status banner */}
                    {status.message && (
                        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${status.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                            {status.message}
                        </div>
                    )}

                    {/* --- PROFILE TAB --- */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSave} className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-3">
                                Profile Information
                            </h2>

                            {/* Profile Picture Picker */}
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    {displayAvatar ? (
                                        <img
                                            src={displayAvatar}
                                            alt="Profile"
                                            className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-2xl font-bold ring-4 ring-indigo-100 dark:ring-indigo-900">
                                            {initials}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-md transition-colors"
                                        title="Change profile picture"
                                    >
                                        <Camera className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile Picture</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">JPG, PNG or GIF, max 5MB</p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-2 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                                    >
                                        {currentAvatarUrl ? 'Change photo' : 'Upload photo'}
                                    </button>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 text-sm cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed.</p>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    placeholder="Tell us a little about yourself..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- NOTIFICATIONS TAB --- */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-3">Notification Preferences</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                                Notification delivery isn't implemented yet — these preferences aren't saved or acted on.
                            </p>
                            {[
                                { label: 'Upload Notifications', desc: 'Get notified when a file upload completes.' },
                                { label: 'Account Alerts', desc: 'Alerts about linked account status changes.' },
                                { label: 'Storage Warnings', desc: 'Warn when a drive is almost full.' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between py-2 opacity-60">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1 shrink-0">
                                        Coming soon
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- SECURITY TAB --- */}
                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-3">Security</h2>

                            {passwordStatus.message && (
                                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${passwordStatus.type === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                    }`}>
                                    {passwordStatus.message}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
