
import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, MapPin, Phone, CreditCard, Banknote, Smartphone, ShieldCheck } from 'lucide-react';
import { OrderStatus, PaymentMethod } from '../types';

interface TrackingOverlayProps {
  order: {
    id: string;
    status: OrderStatus;
    customerName: string;
    paymentMethod: PaymentMethod;
  };
  onClose: () => void;
}

export const TrackingOverlay: React.FC<TrackingOverlayProps> = ({ order, onClose }) => {
  const [progress, setProgress] = useState(20);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(OrderStatus.PENDING);

  useEffect(() => {
    const sequence = [
      { s: OrderStatus.CONFIRMED, p: 40, t: 3000 },
      { s: OrderStatus.DISPATCHED, p: 70, t: 8000 },
      { s: OrderStatus.ARRIVING, p: 90, t: 15000 },
      { s: OrderStatus.COMPLETED, p: 100, t: 25000 },
    ];

    sequence.forEach((step, i) => {
      setTimeout(() => {
        setCurrentStatus(step.s);
        setProgress(step.p);
      }, step.t);
    });
  }, []);

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'MPESA': return <Smartphone className="w-4 h-4" />;
      case 'CARD_ON_DELIVERY': return <CreditCard className="w-4 h-4" />;
      case 'CASH_ON_DELIVERY': return <Banknote className="w-4 h-4" />;
    }
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'MPESA': return 'M-Pesa Express';
      case 'CARD_ON_DELIVERY': return 'Card Payment';
      case 'CASH_ON_DELIVERY': return 'Physical Cash';
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-scale-up">
        <div className="bg-orange-500 p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-orange-100 font-bold text-sm tracking-widest uppercase mb-1">Live Delivery Tracking</p>
              <h2 className="text-3xl font-black">Order #{order.id.slice(-5)}</h2>
              <div className="flex items-center gap-2 mt-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold w-fit">
                {getPaymentIcon(order.paymentMethod)}
                <span>Pay by {getPaymentLabel(order.paymentMethod)} on arrival</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
              <Clock className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white rounded-3xl">
              <Truck className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-xl">Arriving in approx. 12 mins</p>
              <p className="text-orange-100">Our rider David is on the way to your location</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {order.paymentMethod === 'MPESA' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="bg-green-500 p-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-green-800 uppercase tracking-tight">Payment Prep</p>
                <p className="text-[11px] text-green-700">David will trigger a PIN prompt on your phone at your door. Please be ready!</p>
              </div>
            </div>
          )}

          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { s: OrderStatus.PENDING, label: 'Order Set', icon: Clock },
              { s: OrderStatus.CONFIRMED, label: 'Confirmed', icon: CheckCircle2 },
              { s: OrderStatus.DISPATCHED, label: 'On Route', icon: Truck },
              { s: OrderStatus.ARRIVING, label: 'Near You', icon: MapPin },
            ].map((step, i) => {
              const isActive = progress >= (i + 1) * 25 - 5;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-orange-100 text-orange-600 scale-110' : 'bg-slate-50 text-slate-300'}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl overflow-hidden flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=100&h=100" alt="Rider" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">David Njoroge</h4>
              <p className="text-slate-500 text-sm">Divine Gas Top Rider • 4.9 ★</p>
              <div className="flex gap-2 mt-2">
                <a 
                  href="tel:0795556620"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-all"
                >
                  <Phone className="w-3 h-3 text-orange-500" />
                  Call David
                </a>
              </div>
            </div>
          </div>

          {currentStatus === OrderStatus.COMPLETED ? (
            <button onClick={onClose} className="w-full py-5 bg-green-500 text-white font-black rounded-3xl shadow-xl shadow-green-100 animate-bounce">
              ORDER DELIVERED! ENJOY
            </button>
          ) : (
            <div className="text-center">
              <p className="text-slate-400 text-xs italic">Safety Note: Keep your cylinder in a well-ventilated area and always check the seal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
