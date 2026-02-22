import React, { useEffect, useState } from 'react';
import { Package, Calendar, MapPin, Phone, User, Clock, CheckCircle2, Truck } from 'lucide-react';
import { fetchMyOrders } from '../services/api';
import { OrderStatus } from '../types';

interface CustomerDashboardProps {
    user: any;
    token: string;
    onLogout: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, token, onLogout }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            loadOrders();
        }
    }, [token]);

    const loadOrders = async () => {
        try {
            const data = await fetchMyOrders(token);
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-700 border-blue-200';
            case OrderStatus.DISPATCHED: return 'bg-purple-100 text-purple-700 border-purple-200';
            case OrderStatus.ARRIVING: return 'bg-orange-100 text-orange-700 border-orange-200';
            case OrderStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8 animate-fade-in">
            {/* Header Profile */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 -z-0"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">{user.fullName}</h1>
                        <div className="flex flex-col gap-1 mt-1 text-slate-500 font-medium text-sm">
                            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {user.phone}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Ruai, Nairobi</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors relative z-10"
                >
                    Logout
                </button>
            </div>

            {/* Orders */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-6 h-6 text-orange-500" />
                    Order History
                </h2>

                {loading ? (
                    <div className="text-center py-12 text-slate-400 font-medium">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">No orders found yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order #{order.id}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-lg font-black text-slate-900">KES {order.total_amount?.toLocaleString()}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1 justify-end">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                {/* We could show items here if we had them in the response. 
                            Since we blindly fetch all * from orders, we rely on what server sends.
                            Server code now sends items array since we added the loop!
                        */}
                                <div className="space-y-2 border-t border-slate-100 pt-4">
                                    {order.items && order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-700">
                                                {item.quantity}x Gas Cylinder
                                                {/* Ideally we would have product details joined, but lets keep it simple */}
                                            </span>
                                            <span className="font-medium text-slate-500">
                                                {item.purchaseType === 'new' ? 'New Purchase' : 'Refill'}
                                            </span>
                                        </div>
                                    ))}
                                    {(!order.items || order.items.length === 0) && (
                                        <p className="text-sm text-slate-400 italic">Items details not available</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
