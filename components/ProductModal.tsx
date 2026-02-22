
import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Save, Tag, Banknote, Sparkles, Camera, Link as LinkIcon, Loader2, Upload, HardDrive, Type, Weight, Info } from 'lucide-react';
import { GasProduct } from '../types';
import { generateGasImage } from '../services/api';
import { CameraCapture } from './CameraCapture';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: GasProduct) => void;
  product?: GasProduct | null;
}

const COMMON_BRANDS = ['K-Gas', 'Total', 'Rubis', 'Lake Gas', 'Pro-Gas', 'H-Gas'];
const COMMON_SIZES = ['6kg', '13kg', '22.5kg', '50kg'];

type ImageSource = 'url' | 'ai' | 'camera' | 'storage';

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState<GasProduct>({
    id: '',
    brand: 'Pro-Gas',
    size: '6kg',
    price: 0,
    deposit: 0,
    image: ''
  });

  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource>('url');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'refill' | 'new'>('refill');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setIsCustomBrand(!COMMON_BRANDS.includes(product.brand));
      setIsCustomSize(!COMMON_SIZES.includes(product.size));
    } else {
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        brand: 'Pro-Gas',
        size: '6kg',
        price: 1250,
        deposit: 3250,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400'
      });
      setIsCustomBrand(false);
      setIsCustomSize(false);
    }
  }, [product, isOpen]);

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    const generatedUrl = await generateGasImage(formData.brand, formData.size);
    if (generatedUrl) {
      setFormData(prev => ({ ...prev, image: generatedUrl }));
    }
    setIsGenerating(false);
  };

  const handleCapture = (dataUrl: string) => {
    setFormData(prev => ({ ...prev, image: dataUrl }));
    setIsCameraOpen(false);
    setImageSource('url');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {isCameraOpen && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setIsCameraOpen(false)}
          />
        )}

        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-500" />
            {product ? 'Edit Gas Inventory' : 'Add New Gas Brand'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="space-y-6">
            {/* Brand Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-3 h-3" /> Gas Brand
              </label>
              <div className="flex gap-2">
                {!isCustomBrand ? (
                  <select
                    value={formData.brand}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomBrand(true);
                        setFormData({ ...formData, brand: '' });
                      } else {
                        setFormData({ ...formData, brand: e.target.value });
                      }
                    }}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                  >
                    {COMMON_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="CUSTOM">+ Add Other Brand</option>
                  </select>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Enter brand name..."
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                    />
                    <button
                      onClick={() => {
                        setIsCustomBrand(false);
                        setFormData({ ...formData, brand: COMMON_BRANDS[0] });
                      }}
                      className="px-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Use List
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Weight className="w-3 h-3" /> Cylinder Size
              </label>
              <div className="flex gap-2">
                {!isCustomSize ? (
                  <select
                    value={formData.size}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomSize(true);
                        setFormData({ ...formData, size: '' });
                      } else {
                        setFormData({ ...formData, size: e.target.value });
                      }
                    }}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                  >
                    {COMMON_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="CUSTOM">+ Custom Size</option>
                  </select>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={formData.size}
                      onChange={e => setFormData({ ...formData, size: e.target.value })}
                      placeholder="e.g. 15kg"
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                    />
                    <button
                      onClick={() => {
                        setIsCustomSize(false);
                        setFormData({ ...formData, size: COMMON_SIZES[0] });
                      }}
                      className="px-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Use List
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Refill Price (KES)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cylinder Deposit (KES)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.deposit}
                    onChange={e => setFormData({ ...formData, deposit: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-2 items-start">
              <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-indigo-700 font-medium italic">
                Total Price for New Cylinder = Refill Price (KES {formData.price}) + Deposit (KES {formData.deposit}) = <span className="font-bold">KES {(formData.price + formData.deposit).toLocaleString()}</span>
              </p>
            </div>

            {/* Image Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Photo Source</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setImageSource('url')}
                  className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${imageSource === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <LinkIcon className="w-3.5 h-3.5" /> URL
                </button>
                <button
                  onClick={() => setImageSource('storage')}
                  className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${imageSource === 'storage' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <HardDrive className="w-3.5 h-3.5" /> Storage
                </button>
                <button
                  onClick={() => setImageSource('camera')}
                  className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${imageSource === 'camera' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <Camera className="w-3.5 h-3.5" /> Camera
                </button>
                <button
                  onClick={() => setImageSource('ai')}
                  className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${imageSource === 'ai' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI
                </button>
              </div>

              <div className="mt-4">
                {imageSource === 'url' && (
                  <div className="relative animate-scale-up">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      className="w-full p-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
                      placeholder="Enter image URL..."
                    />
                  </div>
                )}

                {imageSource === 'storage' && (
                  <div className="animate-scale-up">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={triggerFilePicker}
                      className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-all group"
                    >
                      <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500" />
                      <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">Select From Memory</span>
                    </button>
                  </div>
                )}

                {imageSource === 'camera' && (
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-all group animate-scale-up"
                  >
                    <Camera className="w-8 h-8 text-slate-300 group-hover:text-indigo-500" />
                    <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">Open Viewfinder</span>
                  </button>
                )}

                {imageSource === 'ai' && (
                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="w-full py-8 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex flex-col items-center justify-center gap-3 group relative overflow-hidden animate-scale-up"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-sm font-bold text-indigo-600">Divine is rendering...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-8 h-8 text-indigo-400 group-hover:scale-125 transition-transform" />
                        <div className="text-center">
                          <span className="text-sm font-bold text-indigo-600 block">AI Photo Generator</span>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 relative pt-6">
              <label className="absolute top-2 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between w-[92%]">
                Live Preview
                <div className="flex gap-2">
                  <button onClick={() => setPreviewType('refill')} className={`px-2 py-0.5 rounded transition-colors ${previewType === 'refill' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-200'}`}>Refill</button>
                  <button onClick={() => setPreviewType('new')} className={`px-2 py-0.5 rounded transition-colors ${previewType === 'new' ? 'bg-orange-500 text-white' : 'hover:bg-slate-200'}`}>New</button>
                </div>
              </label>
              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 rounded-2xl bg-white border overflow-hidden shadow-sm relative group shrink-0">
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg leading-tight">
                    {formData.brand || 'Unnamed Brand'} - {formData.size || 'N/A'} {previewType === 'new' ? '(New Cylinder)' : '(Refill)'}
                  </p>
                  <p className={`font-black tracking-tight mt-1 text-xl ${previewType === 'new' ? 'text-orange-500' : 'text-indigo-600'}`}>
                    KES {(previewType === 'new' ? formData.price + formData.deposit : formData.price).toLocaleString()}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[8px] font-bold uppercase">Ready</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[8px] font-bold uppercase">Stocked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.image || !formData.brand || !formData.size || isGenerating}
            className="flex-1 py-4 bg-indigo-600 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <Save className="w-5 h-5" />
            {product ? 'Update Inventory' : 'Add to Catalog'}
          </button>
        </div>
      </div>
    </div>
  );
};
