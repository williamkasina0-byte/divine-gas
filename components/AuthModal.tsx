import React, { useState } from 'react';
import { X, Loader2, User, Phone, Lock, LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../services/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (token: string, user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            let data;
            if (mode === 'login') {
                data = await login(username, password);
            } else {
                if (!fullName || !phone) {
                    throw new Error("Full Name and Phone are required");
                }
                data = await register(username, password, fullName, phone);
            }

            onLoginSuccess(data.token, data.user);
            onClose();
            // Reset form
            setUsername('');
            setPassword('');
            setFullName('');
            setPhone('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">

                {/* Header */}
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase relative z-10">
                            {mode === 'login' ? 'Welcome Back' : 'Join Divine Gas'}
                        </h2>
                        <p className="text-slate-400 text-xs font-medium relative z-10 mt-1">
                            {mode === 'login' ? 'Login to manage your orders' : 'Create an account for faster checkout'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors relative z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-slate-50 border-b border-slate-100">
                    <button
                        onClick={() => { setMode('login'); setError(null); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'login'
                                ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <LogIn className="w-4 h-4" /> Login
                    </button>
                    <button
                        onClick={() => { setMode('register'); setError(null); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'register'
                                ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <UserPlus className="w-4 h-4" /> Register
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        </div>

                        {mode === 'register' && (
                            <>
                                <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="0712 345 678"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'login' ? 'Login Now' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
};
