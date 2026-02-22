
import React, { useState } from 'react';
import { X, Trash2, ChevronRight, MapPin, CreditCard, RefreshCcw, PackagePlus, Wallet, Banknote, Smartphone, AlertCircle, Info, FileText, Check } from 'lucide-react';
import { OrderItem, PaymentMethod } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onRemove: (id: string, type: 'refill' | 'new') => void;
  onUpdateItem: (id: string, oldType: 'refill' | 'new', updates: Partial<OrderItem>) => void;
  onCheckout: (details: { name: string; phone: string; address: string; paymentMethod: PaymentMethod }) => void;
  user?: any;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, onUpdateItem, onCheckout, user }) => {
  const [step, setStep] = useState<'cart' | 'details'>('cart');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');

  // Auto-fill user details
  React.useEffect(() => {
    if (user) {
      setName(user.fullName || '');
      setPhone(user.phone || '');
      // We could also store/fetch address, but it's not in the simple profile yet
    }
  }, [user]);

  const total = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

  const refillSubtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const depositTotal = items.reduce((sum, item) => {
    if (item.purchaseType === 'new') {
      return sum + (item.deposit * item.quantity);
    }
    return sum;
  }, 0);

  if (!isOpen) return null;

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string; type: 'digital' | 'terminal' | 'basic'; badge?: string }[] = [
    {
      id: 'MPESA',
      label: 'M-Pesa Express',
      icon: <Smartphone className="w-5 h-5" />,
      desc: 'Rider initiates prompt - just enter PIN',
      type: 'digital',
      badge: 'Quickest & Reliable'
    },
    {
      id: 'CASH_ON_DELIVERY',
      label: 'Cash on Delivery',
      icon: <Banknote className="w-5 h-5" />,
      desc: 'Physical Cash',
      type: 'basic'
    },
    {
      id: 'CARD_ON_DELIVERY',
      label: 'Card on Delivery',
      icon: <CreditCard className="w-5 h-5" />,
      desc: 'Visa / Mastercard',
      type: 'terminal'
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Your Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium">Your cart is empty</p>
              <button onClick={onClose} className="text-orange-500 font-bold hover:underline">Start Shopping</button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-6">
              {items.map(item => (
                <div key={`${item.id}-${item.purchaseType}`} className="flex flex-col gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border flex-shrink-0">
                      <img src={item.image} alt={item.brand} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-slate-900">{item.brand} - {item.size}</h3>
                        <button onClick={() => onRemove(item.id, item.purchaseType)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2 mb-3">
                        <button
                          onClick={() => onUpdateItem(item.id, item.purchaseType, { purchaseType: 'refill' })}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${item.purchaseType === 'refill'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <RefreshCcw className="w-3 h-3" /> Exchange
                        </button>
                        <button
                          onClick={() => onUpdateItem(item.id, item.purchaseType, { purchaseType: 'new' })}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${item.purchaseType === 'new'
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <PackagePlus className="w-3 h-3" /> New Cyl
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold text-orange-500 text-lg">KES {item.finalPrice.toLocaleString()}</span>
                        <div className="flex items-center gap-2 font-medium text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                          <button onClick={() => onUpdateItem(item.id, item.purchaseType, { quantity: Math.max(1, item.quantity - 1) })} className="hover:text-orange-500">-</button>
                          <span className="min-w-[1ch] text-center">{item.quantity}</span>
                          <button onClick={() => onUpdateItem(item.id, item.purchaseType, { quantity: item.quantity + 1 })} className="hover:text-orange-500">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-2 border-t border-slate-200/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Instruction</span>
                    </div>
                    <input
                      type="text"
                      value={item.note || ''}
                      onChange={(e) => onUpdateItem(item.id, item.purchaseType, { note: e.target.value })}
                      placeholder="Add a note to this item..."
                      className="w-full bg-white/50 border-none px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 ring-orange-100 transition-all text-slate-600 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Delivery Info
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none rounded-2xl transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Phone Number (M-Pesa)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none rounded-2xl transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Ruai Street/Apartment</label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. Ruai Phase 2, Near Shell Station"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none rounded-2xl transition-all h-24"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-500" />
                  Payment Method
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPaymentMethod(option.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${paymentMethod === option.id
                          ? (option.id === 'MPESA' ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-100' : 'border-orange-500 bg-orange-50 shadow-sm')
                          : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${paymentMethod === option.id
                          ? (option.id === 'MPESA' ? 'bg-green-600 text-white scale-110' : 'bg-orange-500 text-white scale-110')
                          : 'bg-slate-100 text-slate-400'
                        }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className={`font-bold text-sm ${paymentMethod === option.id ? 'text-slate-900' : 'text-slate-700'}`}>
                            {option.label}
                          </p>
                          {option.badge && (
                            <span className="text-[9px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{option.desc}</p>
                      </div>

                      {paymentMethod === option.id && (
                        <div className={`absolute top-2 right-2 flex items-center justify-center transition-all ${option.id === 'MPESA' ? 'animate-bounce' : ''}`}>
                          {option.id === 'MPESA' ? (
                            <div className="bg-green-600 p-1 rounded-full animate-scale-up">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${option.id === 'CASH_ON_DELIVERY' ? 'bg-orange-500' : 'bg-orange-500'}`} />
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 animate-scale-up">
                  {paymentMethod === 'MPESA' && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex gap-3 items-start">
                      <Smartphone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-800">Rider Prompts You (PIN Only)</p>
                        <p className="text-xs text-green-700 leading-relaxed">
                          Once David arrives, he will trigger a push notification to your phone. <strong>You only need to enter your PIN</strong> to complete the payment. No Paybill entry required!
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'CARD_ON_DELIVERY' && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-blue-800">Terminal Availability</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          The rider will carry a POS terminal. Please note that network signal in some parts of Ruai may occasionally delay terminal connection.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'CASH_ON_DELIVERY' && (
                    <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex gap-3 items-start">
                      <Info className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Physical Cash</p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Standard and reliable. Please have the exact amount ready if possible. Our riders carry limited change for safety reasons.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-[10px] flex gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <p className="text-orange-800 font-medium">Safety Note: Payment is only requested after you have inspected the cylinder and confirmed the seal is intact.</p>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-slate-50 space-y-4">
            <div className="space-y-2">
              {depositTotal > 0 && (
                <div className="space-y-1 pb-2 border-b border-slate-200">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Refill Subtotal</span>
                    <span>KES {refillSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Cylinder Deposits</span>
                    <span>KES {depositTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span className="text-slate-600">Grand Total</span>
                <span className="text-slate-900">KES {total.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-green-600 text-sm font-bold flex items-center gap-1 justify-center">
              FREE DELIVERY APPLIED
            </p>

            {step === 'cart' ? (
              <button
                onClick={() => setStep('details')}
                className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
              >
                Checkout Now
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('cart')}
                  className="px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => onCheckout({ name, phone, address, paymentMethod })}
                  disabled={!name || !phone || !address}
                  className="flex-1 py-4 bg-orange-500 disabled:bg-slate-300 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
