
import React, { useState } from 'react';
import { GasProduct } from '../types';
import { Plus, RefreshCcw, PackagePlus, Edit2, PlusCircle, Zap, Timer, FileText } from 'lucide-react';

interface ProductGridProps {
  products: GasProduct[];
  onAddToCart: (product: GasProduct, type: 'refill' | 'new', finalPrice: number, note?: string) => void;
  isEditMode?: boolean;
  onEditProduct?: (product: GasProduct) => void;
  onAddNew?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  isEditMode,
  onEditProduct,
  onAddNew
}) => {
  const [purchaseTypes, setPurchaseTypes] = useState<Record<string, 'refill' | 'new'>>(
    Object.fromEntries(products.map(p => [p.id, 'refill']))
  );
  const [notes, setNotes] = useState<Record<string, string>>({});

  const getPrice = (product: GasProduct, type: 'refill' | 'new') => {
    if (type === 'refill') return product.price;
    return product.price + (product.deposit || 0);
  };

  const toggleType = (id: string, type: 'refill' | 'new') => {
    setPurchaseTypes(prev => ({ ...prev, [id]: type }));
  };

  const handleNoteChange = (id: string, note: string) => {
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  return (
    <section className="py-8 md:py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div className={`${isEditMode ? 'pt-8 md:pt-16' : ''}`}>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              {isEditMode ? 'Inventory Control' : 'Premium Catalog'}
            </h2>
            <p className="text-slate-500 text-base md:text-lg">
              {isEditMode
                ? 'Your custom database is active. All changes are saved locally.'
                : 'Free 15-minute delivery across all brands in Ruai.'}
            </p>
          </div>

          <div className="flex gap-2">
            {!isEditMode && ['All Brands', '6kg', '13kg'].map(filter => (
              <button key={filter} className="hidden sm:block px-6 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all font-bold text-sm">
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {products.map((product) => {
            const type = purchaseTypes[product.id] || 'refill';
            const finalPrice = getPrice(product, type);
            const depositAmount = product.deposit || 0;
            const note = notes[product.id] || '';

            return (
              <div
                key={product.id}
                className={`group rounded-3xl md:rounded-[40px] overflow-hidden border transition-all duration-500 relative ${isEditMode
                  ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300'
                  : 'bg-slate-50 border-slate-100 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100'
                  }`}
              >
                {isEditMode && (
                  <button
                    onClick={() => onEditProduct?.(product)}
                    className="absolute top-4 right-4 z-10 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Details
                  </button>
                )}

                <div className="relative aspect-square overflow-hidden bg-slate-200">
                  <img
                    src={product.image}
                    alt={product.brand}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="px-4 py-2 bg-white/95 backdrop-blur rounded-2xl text-[10px] font-black text-slate-800 shadow-sm uppercase tracking-widest border border-slate-100">
                      {product.brand}
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-2xl font-black text-slate-900 leading-none mb-1">
                        {product.size}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {type === 'refill' ? 'Refill' : 'New'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg md:text-2xl font-black block leading-none ${type === 'new' ? 'text-orange-500' : 'text-indigo-600'}`}>
                        KES {finalPrice.toLocaleString()}
                      </span>
                      <p className={`text-[10px] font-extrabold mt-1 uppercase tracking-tight ${type === 'new' ? 'text-orange-400' : 'text-indigo-400'}`}>
                        {type === 'refill'
                          ? `New is KES ${depositAmount.toLocaleString()} more`
                          : `Refill is KES ${depositAmount.toLocaleString()} less`}
                      </p>
                    </div>
                  </div>

                  <div className="flex p-1 bg-white rounded-xl md:rounded-2xl mb-4 border border-slate-100 shadow-sm">
                    <button
                      disabled={isEditMode}
                      onClick={() => toggleType(product.id, 'refill')}
                      className={`flex-1 py-1.5 md:py-3 text-[10px] md:text-xs font-black rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1 md:gap-2 ${type === 'refill' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <RefreshCcw className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      REFILL
                    </button>
                    <button
                      disabled={isEditMode}
                      onClick={() => toggleType(product.id, 'new')}
                      className={`flex-1 py-1.5 md:py-3 text-[10px] md:text-xs font-black rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1 md:gap-2 ${type === 'new' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <PackagePlus className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      NEW
                    </button>
                  </div>

                  {/* Note Field */}
                  {!isEditMode && (
                    <div className="mb-6 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        <FileText className="w-3 h-3" /> Special Note?
                      </div>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => handleNoteChange(product.id, e.target.value)}
                        placeholder="e.g. Leave at gate"
                        className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 ring-orange-100 focus:border-orange-200 transition-all"
                      />
                    </div>
                  )}

                  <button
                    disabled={isEditMode}
                    onClick={() => {
                      onAddToCart(product, type, finalPrice, note);
                      setNotes(prev => ({ ...prev, [product.id]: '' }));
                    }}
                    className={`w-full py-3 md:py-5 font-black rounded-2xl md:rounded-[24px] flex items-center justify-center gap-2 transition-all border-2 text-[10px] md:text-base ${isEditMode
                      ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                      : 'bg-white border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white shadow-sm'
                      }`}
                  >
                    <Plus className="w-4 h-4 md:w-6 md:h-6" />
                    {isEditMode ? 'ADMIN ONLY' : 'ADD TO CART'}
                  </button>
                </div>
              </div>
            );
          })}

          {isEditMode && (
            <button
              onClick={onAddNew}
              className="border-4 border-dashed border-indigo-200 rounded-[40px] flex flex-col items-center justify-center gap-6 p-12 text-indigo-300 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group min-h-[500px]"
            >
              <div className="p-8 bg-indigo-50 rounded-[32px] group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                <PlusCircle className="w-16 h-16" />
              </div>
              <div className="text-center">
                <span className="font-black text-2xl block mb-2">Add New Gas</span>
                <p className="text-sm font-bold text-slate-400 max-w-[200px]">Define a custom brand or cylinder size for the Ruai hub</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
