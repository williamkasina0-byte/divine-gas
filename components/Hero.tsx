
import React from 'react';
import { Timer, MapPin, PlayCircle, Zap, Clock } from 'lucide-react';

interface HeroProps {
  onSimulateOrder?: () => void;
  onCheckCoverage?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSimulateOrder, onCheckCoverage }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 px-4">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-48 h-48 md:w-72 md:h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-48 h-48 md:w-72 md:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-6 md:space-y-8 text-center md:text-left">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-green-600 text-white rounded-full font-black text-[10px] md:text-sm shadow-xl shadow-green-100 animate-bounce">
              <Zap className="w-3 h-3 md:w-4 md:h-4 fill-white" />
              <span>FREE DELIVERY IN 15 MINUTES</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-slate-900 text-white rounded-full font-black text-[10px] md:text-sm shadow-xl">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
              <span>8AM - 10PM DAILY</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1]">
            Cooking Gas <br />
            <span className="text-orange-500">Delivered Free</span> <br />
            <span className="text-slate-800 text-2xl md:text-6xl underline decoration-green-400 underline-offset-8">Fastest In Ruai</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl">
            Never run out of gas mid-meal. Order now and get <span className="font-black text-slate-900">FREE 15-minute delivery</span> anywhere in Ruai. Open Monday to Sunday!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button className="px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-2xl shadow-orange-200 transition-all hover:scale-105 active:scale-95 text-xl flex items-center justify-center gap-3">
              Order Now
              <Zap className="w-5 h-5 fill-white" />
            </button>
            <button
              onClick={onCheckCoverage}
              className="px-8 py-5 bg-white border-2 border-slate-200 hover:border-orange-500 text-slate-700 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5 text-orange-500" />
              Check Coverage
            </button>

            {onSimulateOrder && (
              <button
                onClick={onSimulateOrder}
                className="px-6 py-5 border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-500 hover:text-orange-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                <div className="relative">
                  <PlayCircle className="w-5 h-5" />
                  <span className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"></span>
                </div>
                See Tracking Demo
              </button>
            )}
          </div>

          <div className="flex items-center gap-8 pt-4 justify-center md:justify-start">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-slate-900">5k+</span>
              <span className="text-slate-500 text-sm">Ruai Customers</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold text-slate-900">15 min</span>
              </div>
              <span className="text-slate-500 text-sm">Average Delivery</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-green-600">FREE</span>
              <span className="text-slate-500 text-sm">Delivery Cost</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
