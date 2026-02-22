import { useEffect } from 'react';
import useDriveStore from '../store/useDriveStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Analytics = () => {
    const { analytics, fetchAnalytics } = useDriveStore();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Storage Analytics</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics.map((acc) => {
                    const used = parseInt(acc.usage || 0);
                    const total = parseInt(acc.limit || 0);
                    const free = Math.max(total - used, 0);
                    const data = [
                        { name: 'Used', value: used },
                        { name: 'Free', value: free },
                    ];
                    const pct = total > 0 ? ((used / total) * 100).toFixed(1) : 0;

                    return (
                        <div key={acc.accountId} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 truncate">{acc.email}</h3>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pct > 80
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                    }`}>
                                    {pct}% used
                                </span>
                            </div>

                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell key="cell-used" fill="#4F46E5" />
                                            <Cell key="cell-free" fill="#E5E7EB" />
                                        </Pie>
                                        <Tooltip formatter={(value) => formatBytes(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 mb-4">
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Used</p>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{formatBytes(acc.usage)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Total</p>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{formatBytes(acc.limit)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Trash</p>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{formatBytes(acc.usageInTrash)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {analytics.length === 0 && (
                <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No analytics available. Start by linking a drive account.</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;
