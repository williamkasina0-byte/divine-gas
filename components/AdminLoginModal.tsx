import React, { useState } from 'react';
import { Lock, X, Loader2 } from 'lucide-react';
import { login } from '../services/api';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await login(password);
            onLoginSuccess(data.token);
            onClose();
        } catch (err) {
            setError('Invalid password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scale-up">
                <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Admin Access</h2>
                    <p className="text-sm text-slate-500">Enter password to manage inventory</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin Password"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-200"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};
