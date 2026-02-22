
import React from 'react';
import { Flame, ShoppingCart, User, Phone, Settings, Zap, Shield, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  user?: any;
  onOpenAuth?: () => void;
  onOpenDashboard?: () => void;
  onLogout?: () => void;
  siteName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  isEditMode,
  onToggleEditMode,
  user,
  onOpenAuth,
  onOpenDashboard,
  onLogout,
  siteName = 'DIVINE GAS'
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const logoMain = siteName.split(' ')[0] || 'DIVINE';
  const logoSub = siteName.split(' ').slice(1).join('') || 'GAS';

  return (
    <nav className="sticky top-0 z-[100] glass-morphism border-b border-orange-100 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer group shrink-0">
          <div className="bg-orange-500 p-2 rounded-xl group-hover:bg-orange-600 transition-colors">
            <Flame className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800 uppercase">
            {logoMain}<span className="text-orange-500 font-black">{logoSub}</span>
          </span>
        </div>

        {/* Center - Desktop Only */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-100 rounded-full">
            <Zap className="w-4 h-4 text-green-600 fill-green-600" />
            <span className="text-xs font-black text-green-700 uppercase tracking-tight">Free 15-Min Delivery</span>
          </div>

          {(!user || user.role?.toLowerCase() === 'admin') && (
            <button
              onClick={onToggleEditMode}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-tight transition-all shadow-lg ${isEditMode
                ? 'bg-indigo-600 text-white animate-pulse'
                : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50'
                }`}
            >
              <Shield className="w-4 h-4" />
              {isEditMode ? 'Admin Mode: ON' : 'Admin Portal'}
            </button>
          )}
        </div>

        {/* Right Side - Icons and User */}
        <div className="flex items-center gap-2 md:gap-5">
          {/* Admin Toggle (Mobile Only Icon) */}
          {(!user || user.role?.toLowerCase() === 'admin') && (
            <button
              onClick={onToggleEditMode}
              className={`p-2.5 rounded-xl transition-all lg:hidden ${isEditMode
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              title="Admin Portal"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}

          {/* User Section - Desktop */}
          <div className="hidden md:block">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-slate-700 hidden sm:block">{user.username}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-scale-up z-[60]">
                    {user.role?.toLowerCase() === 'admin' && (
                      <button
                        onClick={() => { onToggleEditMode(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Shield className={`w-4 h-4 ${isEditMode ? 'text-green-500' : 'text-slate-400'}`} />
                        Dashboard View
                      </button>
                    )}

                    <button
                      onClick={() => { onOpenDashboard?.(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      My Account
                    </button>

                    <div className="h-px bg-slate-100 my-1"></div>

                    <button
                      onClick={() => { onLogout?.(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-bold">Login</span>
              </button>
            )}
          </div>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 md:p-3 rounded-full bg-slate-100 hover:bg-orange-500 hover:text-white transition-all group shadow-sm"
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 bg-slate-900 text-white rounded-xl md:hidden flex items-center justify-center transition-all active:scale-90"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute top-full left-0 w-full shadow-2xl animate-slide-down z-[60]">
          <div className="p-4 space-y-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{user.username}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { onOpenDashboard?.(); setIsMobileMenuOpen(false); }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    <User className="w-5 h-5 text-slate-600" />
                    <span className="text-[10px] font-black uppercase text-slate-600">Account</span>
                  </button>
                  <button
                    onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-all text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => { onOpenAuth?.(); setIsMobileMenuOpen(false); }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                Login / Register
              </button>
            )}

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
              <Zap className="w-4 h-4 text-green-600 fill-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-tight">Free 15-Minute Delivery in Ruai</span>
            </div>
          </div>
        </div>
      )}
    </nav >
  );
};
