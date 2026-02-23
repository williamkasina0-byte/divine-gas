import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Package,
    ShoppingBag,
    Users,
    Settings,
    LogOut,
    LayoutDashboard,
    Shield,
    ArrowLeft,
    RotateCcw,
    Zap,
    Activity
} from 'lucide-react';
import { AdminOrders } from './AdminOrders';
import { ProductGrid } from './ProductGrid';
import {
    fetchAdminStats,
    fetchAdminUsers,
    fetchSettings,
    updateSettings,
    updateUserRole,
    deleteUser,
    fetchUserActivity
} from '../services/api';

interface AdminPortalProps {
    token: string;
    onExit: () => void;
    products: any[];
    onSaveProduct: (product: any) => Promise<void>;
    onDeleteProduct: (id: string) => Promise<void>;
    onEditProduct: (product: any) => void;
    onAddNew: () => void;
    onSettingsUpdate?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
    token,
    onExit,
    products,
    onSaveProduct,
    onDeleteProduct,
    onEditProduct,
    onAddNew,
    onSettingsUpdate
}) => {
const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'users' | 'settings' | 'activity'>('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchAdminStats(token);
                setStats(data);
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, [token]);

const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'activity', label: 'Activity', icon: Activity },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen flex-col lg:flex-row">
            {/* Sidebar - Desktop Only */}
            <div className="hidden lg:flex w-64 bg-slate-900 text-white flex-col shrink-0 sticky top-[64px] h-[calc(100vh-64px)] border-r border-slate-800">
                <div className="p-8 flex items-center gap-3 bg-slate-900/50">
                    <div className="bg-indigo-600 p-2 rounded-xl">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xs tracking-widest uppercase">Ruai Hub</span>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Command v2.1</span>
                    </div>
                </div>

                <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-bold text-xs uppercase tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 bg-slate-900">
                    <button
                        onClick={onExit}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all group border border-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-xs uppercase">Storefront</span>
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white z-[110] border-t border-slate-800 flex justify-around p-2 pb-safe">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-500'}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50">
                <header className="bg-white border-b border-gray-100 px-8 py-8 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-[64px] z-20">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 capitalize tracking-tight">
                            {activeTab} <span className="text-indigo-600">Terminal</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Divine Gas Secure Administrative Layer</p>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Network Secure</span>
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 max-w-[1600px]">
                    {activeTab === 'dashboard' && (
                        <DashboardView stats={stats} isLoading={isLoading} />
                    )}
                    {activeTab === 'orders' && (
                        <AdminOrders token={token} />
                    )}
                    {activeTab === 'users' && (
                        <UsersView token={token} />
                    )}
{activeTab === 'settings' && (
                        <SettingsView token={token} onUpdate={onSettingsUpdate} />
                    )}
                    {activeTab === 'activity' && (
                        <ActivityView token={token} />
                    )}
                    {activeTab === 'inventory' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100 gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32"></div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black mb-2">Inventory Management</h3>
                                    <p className="text-indigo-300 font-bold text-sm tracking-tight">Modify your digital storefront catalog for the Ruai delivery zone.</p>
                                </div>
                                <button
                                    onClick={onAddNew}
                                    className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black hover:bg-indigo-500 hover:scale-105 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/40 relative z-10"
                                >
                                    <Package className="w-6 h-6" />
                                    CREATE PRODUCT
                                </button>
                            </div>

                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                                <ProductGrid
                                    products={products}
                                    onAddToCart={() => { }}
                                    isEditMode={true}
                                    onEditProduct={onEditProduct}
                                    onAddNew={onAddNew}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ stats, isLoading }: any) => {
    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <RotateCcw className="w-12 h-12 text-indigo-600 animate-spin" />
            <span className="font-black text-slate-400 uppercase tracking-widest">Compiling Metrics...</span>
        </div>
    );

    const cards = [
        { label: 'Revenue Generated', value: `KES ${stats?.revenue?.toLocaleString()}`, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Gross Profitability' },
        { label: 'Dispatched Orders', value: stats?.orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Completed Deliveries' },
        { label: 'Active Personnel', value: stats?.users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Customers & Staff' },
        { label: 'Stock Variations', value: stats?.products, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', sub: 'Catalog Items' },
    ];

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${card.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                                <card.icon className={`w-8 h-8 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-indigo-600 p-10 rounded-[40px] text-white shadow-2xl shadow-indigo-200 overflow-hidden relative group">
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black mb-4">Smart Hub Active</h3>
                        <p className="text-indigo-100 font-bold mb-8 max-w-md leading-relaxed">
                            Your Divine Gas administrative control center is synchronized. Manage inventory levels, track order fulfillment, and update site-wide parameters in real-time.
                        </p>
                        <div className="flex gap-4">
                            <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md">
                                <span className="block text-[10px] font-black text-indigo-200 uppercase mb-1">System Health</span>
                                <span className="font-bold">OPTIMAL</span>
                            </div>
                            <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md">
                                <span className="block text-[10px] font-black text-indigo-200 uppercase mb-1">Latency</span>
                                <span className="font-bold">14ms</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-600 fill-orange-600" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 tracking-tight">Express Sync</h4>
                            <p className="text-sm text-slate-400 font-bold">Automatic Database Refresh</p>
                        </div>
                    </div>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Changes made to the inventory or site settings are immediately propagated to the mobile and web storefronts. Ensure catalog accuracy before finalizing updates.
                    </p>
                </div>
            </div>
        </div>
    );
};

const UsersView = ({ token }: { token: string }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadUsers = async () => {
        try {
            const data = await fetchAdminUsers(token);
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [token]);

    const handleRoleUpdate = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'customer' : 'admin';
        if (!window.confirm(`Are you sure you want to change this user to ${newRole.toUpperCase()}?`)) return;

        setActionLoading(userId);
        try {
            await updateUserRole(token, userId, newRole);
            await loadUsers();
        } catch (err) {
            alert("Failed to update user role");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm("CRITICAL: Are you sure you want to PERMANENTLY delete this user account?")) return;

        setActionLoading(userId);
        try {
            await deleteUser(token, userId);
            await loadUsers();
        } catch (err) {
            alert("Failed to delete user");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <RotateCcw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );

    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-100">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Identity</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorization Level</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Date</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-900">{user.full_name || user.username}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">ID: #USR-{user.id.toString().padStart(4, '0')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin'
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                        <Shield className="w-3 h-3" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase">
                                    {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRoleUpdate(user.id, user.role)}
                                            disabled={actionLoading === user.id}
                                            className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                                            title={user.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                                        >
                                            <Shield className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            disabled={actionLoading === user.id}
                                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                            title="Delete User"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ActivityView = ({ token }: { token: string }) => {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadActivities = async () => {
            try {
                const data = await fetchUserActivity(token);
                setActivities(data);
            } catch (err) {
                console.error("Failed to load activities", err);
            } finally {
                setLoading(false);
            }
        };
        loadActivities();
    }, [token]);

    if (loading) return (
        <div className="flex justify-center py-20">
            <RotateCcw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );

    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <h3 className="text-xl font-black text-slate-900">User Activity Log</h3>
                <p className="text-sm text-slate-500 font-medium">Recent user actions and system events</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No activity recorded yet</div>
                ) : (
                    activities.map((activity, idx) => (
                        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-slate-900">{activity.username || 'Unknown User'}</span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">{activity.action}</p>
                                    {activity.details && (
                                        <p className="text-xs text-slate-500 mt-1">{activity.details}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const SettingsView = ({ token, onUpdate }: { token: string, onUpdate?: () => void }) => {
    const [settings, setSettings] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings().then(setSettings);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings(token, settings);
            alert("Settings updated successfully!");
            onUpdate?.();
        } catch (err) {
            alert("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black mb-2">Global Parameters</h3>
                        <p className="text-indigo-300 font-bold text-sm tracking-tight">Configure site-wide constants and operational metadata.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Branding & Identity</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Company Title</label>
                                    <input
                                        type="text"
                                        value={settings.site_name || ''}
                                        onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-slate-900"
                                        placeholder="e.g. DIVINE GAS"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Operating Schedule</label>
                                    <input
                                        type="text"
                                        value={settings.operating_hours || ''}
                                        onChange={e => setSettings({ ...settings, operating_hours: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-slate-900"
                                        placeholder="e.g. Open 8am - 10pm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact & Logistics</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Primary Hotline</label>
                                    <input
                                        type="text"
                                        value={settings.phone || ''}
                                        onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">WhatsApp Hook (254...)</label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp || ''}
                                        onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:grayscale"
                        >
                            {saving ? 'Synchronizing Pipeline...' : 'Commit Changes to Production'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
