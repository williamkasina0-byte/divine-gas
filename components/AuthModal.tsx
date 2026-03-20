import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Phone, Lock, LogIn, UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle, Mail, ArrowRight, Shield } from 'lucide-react';
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
    const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    // Validation States
    const [passwordFeedback, setPasswordFeedback] = useState<{ strength: number; label: string; requirements: { length: boolean; upper: boolean; number: boolean; special: boolean; } }>({
        strength: 0,
        label: 'Too Short',
        requirements: { length: false, upper: false, number: false, special: false }
    });

    useEffect(() => {
        if (mode === 'register') {
            let strength = 0;
            const requirements = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
            };

            if (requirements.length) strength++;
            if (requirements.upper) strength++;
            if (requirements.number) strength++;
            if (requirements.special) strength++;

            let label = 'Too Short';
            if (password.length === 0) {
                label = 'Too Short';
            } else if (strength === 1) {
                label = 'Weak';
            } else if (strength === 2) {
                label = 'Fair';
            } else if (strength === 3) {
                label = 'Good';
            } else if (strength === 4) {
                label = 'Strong';
            }

            setPasswordFeedback({ strength, label, requirements });
        }
    }, [password, mode]);

    useEffect(() => {
        setError(null);
        setRegistrationSuccess(null);
    }, [mode]);

    if (!isOpen) return null;

    const validateForm = () => {
        setError(null);
        if (mode === 'register') {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
            if (!emailRegex.test(username)) {
                setError("Please enter a valid email address");
                return false;
            }

            const [localPart, domain] = username.split('@');
            const disposable = [
                'mailinator.com', 'yopmail.com', 'tempmail.com', 'guerrillamail.com',
                'dispostable.com', 'getnada.com', '10minutemail.com', 'sharklasers.com',
                'trashmail.com', 'maildrop.cc', 'temp-mail.org', 'fakeinbox.com'
            ];
            if (disposable.includes(domain.toLowerCase())) {
                setError("Disposable email addresses are not allowed for security");
                return false;
            }

            if (/(.)\1{4,}/.test(localPart)) {
                setError("Please use a real, professional email address");
                return false;
            }

            const typos = ['gamil.com', 'gmial.com', 'yaho.com', 'hotmial.com', 'outlok.com'];
            if (typos.includes(domain.toLowerCase())) {
                setError(`Did you mean ${domain.includes('gamil') || domain.includes('gmial') ? 'gmail.com' : domain.includes('yaho') ? 'yahoo.com' : 'the correct domain'}?`);
                return false;
            }

            const words = fullName.trim().split(/\s+/).filter(w => w.length > 0);
            if (words.length < 2) {
                setError("Please provide your real First and Last Name");
                return false;
            }

            const phoneClean = phone.replace(/\s/g, '');
            const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
            if (!phoneRegex.test(phoneClean)) {
                setError("Please enter a valid Kenyan phone number");
                return false;
            }

            const prefixes = ['70', '71', '72', '74', '75', '76', '79', '11', '73', '78', '10', '77'];
            const last9 = phoneClean.slice(-9);
            if (!prefixes.includes(last9.slice(0, 2))) {
                setError("Please use a recognized Safaricom, Airtel, or Telkom number");
                return false;
            }

            if (passwordFeedback.strength < 4) {
                setError("Please ensure your password meets all safety requirements");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setRegistrationSuccess(null);

        try {
            if (mode === 'login') {
                const response = await login(username, password);
                onLoginSuccess(response.token, response.user);
                onClose();
            } else {
                const response = await register(username, password, fullName, phone);
                setRegistrationSuccess(response.email || username);
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || (mode === 'login' ? "Login failed" : "Registration failed"));
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
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors relative z-10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8">
                    {registrationSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-orange-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h3>
                            <p className="text-slate-600 mb-6">
                                We've sent a verification link to <span className="font-semibold text-slate-800">{registrationSuccess}</span>. 
                                Please click the link in your inbox to activate your account.
                            </p>
                            <button
                                onClick={() => {
                                    setRegistrationSuccess(null);
                                    setMode('login');
                                    setUsername('');
                                    setPassword('');
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                            >
                                <LogIn className="w-5 h-5" />
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
                                <button
                                    onClick={() => setMode('login')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                                        mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <LogIn className="w-4 h-4" />
                                    Login
                                </button>
                                <button
                                    onClick={() => setMode('register')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                                        mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Register
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 animate-shake ${
                                    error.includes('verified') ? 'bg-orange-50 border border-orange-100 text-orange-800' : 'bg-red-50 border border-red-100 text-red-800'
                                }`}>
                                    {error.includes('verified') ? (
                                        <Shield className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    )}
                                    <p className="text-sm font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'register' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                                                    placeholder="07XX XXX XXX"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {mode === 'register' && password.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Strength</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    passwordFeedback.strength <= 1 ? 'text-red-500' :
                                                    passwordFeedback.strength === 2 ? 'text-orange-500' :
                                                    passwordFeedback.strength === 3 ? 'text-blue-500' :
                                                    'text-green-500'
                                                }`}>{passwordFeedback.label}</span>
                                            </div>
                                            <div className="flex gap-1 h-1 px-0.5">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex-1 rounded-full transition-all duration-500 ${
                                                            i <= passwordFeedback.strength
                                                                ? i === 1 ? 'bg-red-500' :
                                                                  i === 2 ? 'bg-orange-500' :
                                                                  i === 3 ? 'bg-blue-500' :
                                                                  'bg-green-500'
                                                                : 'bg-slate-100'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pt-1">
                                                {[
                                                    { key: 'length', label: '8+ Characters' },
                                                    { key: 'upper', label: 'Uppercase' },
                                                    { key: 'number', label: 'Number' },
                                                    { key: 'special', label: 'Special char' }
                                                ].map((req) => (
                                                    <div key={req.key} className="flex items-center gap-1.5">
                                                        <CheckCircle2 className={`w-3 h-3 ${passwordFeedback.requirements[req.key as keyof typeof passwordFeedback.requirements] ? 'text-green-500' : 'text-slate-200'}`} />
                                                        <span className={`text-[9px] font-bold ${passwordFeedback.requirements[req.key as keyof typeof passwordFeedback.requirements] ? 'text-slate-600' : 'text-slate-400'}`}>{req.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group mt-4 mb-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {mode === 'login' ? 'Login to Account' : 'Create Account'}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                
                                {mode === 'register' && (
                                    <p className="text-xs text-center text-slate-500 px-4">
                                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                )}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
