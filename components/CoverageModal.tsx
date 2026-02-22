
import React from 'react';
import { X, MapPin, CheckCircle2, Navigation } from 'lucide-react';
import { DELIVERY_AREAS } from '../constants';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoverageModal: React.FC<CoverageModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh]">
        <div className="p-8 bg-orange-500 text-white shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3">
                <MapPin className="w-8 h-8" />
                Ruai Coverage
              </h2>
              <p className="text-orange-100 mt-2 font-medium">
                We deliver to these areas within 15 minutes of ordering.
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-2xl">
            <Navigation className="w-5 h-5 text-orange-200" />
            <span className="text-sm font-bold">Currently delivering to {DELIVERY_AREAS.length} key areas in Ruai & Utawala.</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DELIVERY_AREAS.map((area, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <span className="font-bold text-slate-700">{area}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl text-center">
            <p className="text-blue-800 font-bold mb-1">Not seeing your estate?</p>
            <p className="text-blue-600 text-sm">We are focused on Ruai and Utawala. Call us at 0795556620 to check if we can reach you!</p>
          </div>
        </div>

        <div className="p-6 border-t bg-white shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-colors"
          >
            GOT IT, THANKS!
          </button>
        </div>
      </div>
    </div>
  );
};
