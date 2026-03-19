import React, { useState, useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle2, AlertCircle, ShoppingBag, User, Phone, MapPin, ChevronDown, Loader2, Search, Bell } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus } from '../services/api';
import { OrderStatus } from '../types';

interface AdminOrdersProps {
    token: string;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ token }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<string>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const requestNotificationPermission = async () => {
        if (typeof Notification !== 'undefined') {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                new Notification('Notifications Enabled!', {
                    body: 'You will now receive alerts for new orders.',
                    icon: '/favicon.ico'
                });
            }
        }
    };

    const loadOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllOrders(token);
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadOrders();

        // Establish SSE Connection for real-time order notifications
        const sseUrl = `/api/admin/notifications/stream?token=${token}`;
        const eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
            console.log("SSE Connection opened successfully");
        };

        eventSource.onmessage = (event) => {
            console.log("Received SSE raw event:", event.data);
            try {
                const data = JSON.parse(event.data);
                console.log("Parsed SSE event:", data);
                if (data.type === 'new_order') {
                    const newOrder = data.payload;
                    console.log("Handling new order payload:", newOrder);
                    // Add the new order to the top of the list
                    setOrders(prev => [newOrder, ...prev]);

                    // Show a simple browser alert / toast
                    // In a bigger app, use react-hot-toast or similar.
                    // For now, let's use a native browser Notification if permitted, or alert.
                    if (Notification.permission === 'granted') {
                        new Notification('New Order Received!', {
                            body: `Order #${newOrder.id} from ${newOrder.name || newOrder.customer_name} for KES ${newOrder.total}`,
                            icon: '/favicon.ico' // Ensure you have an icon
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification('New Order Received!', {
                                    body: `Order #${newOrder.id} from ${newOrder.name || newOrder.customer_name} for KES ${newOrder.total}`
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to parse SSE message", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection error", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [loadOrders, token]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatus(token, orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err: any) {
            alert("Failed to update status: " + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'PROCESSING': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm)
    );

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                <p className="text-slate-500 font-medium animate-pulse">Loading all orders...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-200">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Order Management</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{orders.length} Total Orders</p>
                                {notificationPermission === 'default' && (
                                    <button
                                        onClick={requestNotificationPermission}
                                        className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-all flex items-center gap-1.5"
                                    >
                                        <Bell className="w-3.5 h-3.5" />
                                        Enable Alerts
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Name or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all font-medium outline-none"
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer Info</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Items</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 grayscale opacity-40">
                                            <Package className="w-12 h-12 text-slate-300" />
                                            <p className="text-slate-500 font-medium">No orders found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-6 font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-bold mb-1">#{order.id}</span>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    {order.customer_name}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {order.phone}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{order.address}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                {order.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="text-xs font-bold text-slate-600 bg-slate-100/50 px-2 py-1 rounded-lg">
                                                        {item.quantity}x {item.purchase_type === 'refill' ? 'Refill' : 'New'}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-lg font-black text-slate-800">
                                                KES {order.total_amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tight border ${getStatusColor(order.status)}`}>
                                                {order.status === 'DELIVERED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                {order.status === 'PENDING' && <AlertCircle className="w-3.5 h-3.5" />}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="relative inline-block text-left">
                                                <select
                                                    value={order.status}
                                                    disabled={updatingId === order.id}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 pl-4 pr-10 rounded-xl cursor-pointer transition-all disabled:opacity-50 outline-none border-none"
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="PROCESSING">Processing</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                {updatingId === order.id && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">No orders found.</div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.id} className="p-6 space-y-4 bg-white hover:bg-slate-50/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-slate-900">#{order.id}</span>
                                        <span className="text-xs font-bold text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <User className="w-4 h-4 text-slate-400" />
                                        {order.customer_name}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        {order.phone}
                                    </div>
                                    <div className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed bg-slate-50 p-2 rounded-xl">
                                        <MapPin className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                        {order.address}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {order.items?.map((item: any, idx: number) => (
                                        <span key={idx} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-tighter">
                                            {item.quantity}x {item.purchase_type}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-xl font-black text-slate-900">KES {order.total_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={order.status}
                                            disabled={updatingId === order.id}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className="appearance-none bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest py-3 pl-4 pr-10 rounded-2xl outline-none"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="PROCESSING">Processing</option>
                                            <option value="DELIVERED">Delivered</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
