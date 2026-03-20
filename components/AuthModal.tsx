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
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [registrationStep, setRegistrationStep] = useState(1); // 1: Details, 2: Verification
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

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
        if (mode === 'login') {
            setRegistrationStep(1);
        } else {
            setRegistrationStep(1);
            setVerificationCode('');
            setIsVerifying(false);
        }
    }, [mode]);

    if (!isOpen) return null;

    const validateForm = () => {
        setError(null);
        if (mode === 'register') {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
            if (!emailRegex.test(username)) {
                setError("Please enter a valid, professional email address");
                return false;
            }

            const disposable = ['mailinator.com', 'yopmail.com', 'tempmail.com', 'guerrillamail.com'];
            if (disposable.some(d => username.toLowerCase().endsWith(d))) {
                setError("Disposable email addresses are not allowed for security");
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

    const handleNextStep = async () => {
        if (!validateForm()) return;
        setIsVerifying(true);
        setError(null);
        setTimeout(() => {
            setIsVerifying(false);
            setRegistrationStep(2);
        }, 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'register' && registrationStep === 1) {
            handleNextStep();
            return;
        }

        if (mode === 'register' && registrationStep === 2) {
            if (verificationCode !== '123456') {
                setError("Invalid verification code. Please enter 123456 for demo.");
                return;
            }
        }

        setLoading(true);
        try {
            let result;
            if (mode === 'login') {
                result = await login(username, password);
            } else {
                result = await register(username, password, fullName, phone);
            }
            onLoginSuccess(result.token, result.user);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            if (mode === 'register') setRegistrationStep(1);
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
                            {mode === 'login' ? 'Login to manage your orders' : (registrationStep === 1 ? 'Create an account for faster checkout' : 'Verify your details')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors relative z-10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs (Only in step 1) */}
                {registrationStep === 1 && (
                    <div className="flex p-2 gap-2 bg-slate-50 border-b border-slate-100">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            <LogIn className="w-4 h-4" /> Login
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            <UserPlus className="w-4 h-4" /> Register
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {mode === 'register' && registrationStep === 2 ? (
                        <div className="space-y-6 animate-scale-up py-4 text-center">
                            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                                <Shield className="w-8 h-8 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Verify Your Identity</h3>
                                <p className="text-sm text-slate-500 mt-1">We've recognized your details as legitimate. Please enter the 6-digit code sent to your phone to finish.</p>
                            </div>
                            <div className="relative max-w-[200px] mx-auto">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="123456"
                                    className="w-full text-center text-2xl font-black tracking-[0.5em] py-4 bg-slate-50 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:bg-white transition-all outline-none"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button type="button" onClick={() => setRegistrationStep(1)} className="text-xs font-bold text-orange-600 hover:underline">Edit Details</button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {mode === 'register' && (
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                placeholder="First & Last Name"
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="07XX XXX XXX"
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
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
                            </div>

                            {mode === 'register' && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Strength</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            passwordFeedback.strength === 0 ? 'text-slate-400' :
                                            passwordFeedback.strength === 1 ? 'text-red-500' :
                                            passwordFeedback.strength === 2 ? 'text-orange-500' :
                                            passwordFeedback.strength === 3 ? 'text-blue-500' :
                                            'text-green-500'
                                        }`}>{passwordFeedback.label}</span>
                                    </div>
                                    <div className="flex gap-1 h-1.5 px-0.5">
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
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-1">
                                        {[
                                            { key: 'length', label: '8+ Characters' },
                                            { key: 'upper', label: 'Uppercase' },
                                            { key: 'number', label: 'Number' },
                                            { key: 'special', label: 'Special char' }
                                        ].map((req) => (
                                            <div key={req.key} className="flex items-center gap-2">
                                                <CheckCircle2 className={`w-3.5 h-3.5 ${passwordFeedback.requirements[req.key as keyof typeof passwordFeedback.requirements] ? 'text-green-500' : 'text-slate-200'}`} />
                                                <span className={`text-[10px] font-bold ${passwordFeedback.requirements[req.key as keyof typeof passwordFeedback.requirements] ? 'text-slate-600' : 'text-slate-400'}`}>{req.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || isVerifying}
                        className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${loading || isVerifying ? 'opacity-70 cursor-wait' : 'hover:bg-slate-800'}`}
                    >
                        {loading || isVerifying ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>{mode === 'login' ? 'Access Account' : (registrationStep === 1 ? 'Verify Details' : 'Complete Registration')}</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    
                    {mode === 'register' && registrationStep === 1 && (
                        <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                            By verifying, you confirm these are your real details for Divine Gas delivery services in Ruai.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};
