
import React from 'react';
import { X, ShieldCheck, FileText, Scale } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const content = {
    privacy: {
      title: 'Privacy Policy',
      icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
      sections: [
        {
          h: 'Information Collection',
          p: 'We collect your name, phone number, and delivery location exclusively to fulfill your gas orders in Ruai and Utawala. Your data is stored locally on your device for inventory management if you use the editor features.'
        },
        {
          h: 'Data Usage',
          p: 'Your contact information is only shared with our riders (like David) during an active delivery to ensure your gas arrives within the 15-minute guarantee.'
        },
        {
          h: 'Third Parties',
          p: 'We do not sell your data. Payment processing via M-Pesa is handled securely through standard provider protocols.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service',
      icon: <Scale className="w-8 h-8 text-indigo-500" />,
      sections: [
        {
          h: '15-Minute Guarantee',
          p: 'Our 15-minute delivery promise applies to Ruai and Utawala environs. If we exceed 20 minutes due to unforeseen circumstances, we offer apologies and potentially discounted delivery fees as per our loyalty program.'
        },
        {
          h: 'Safety Compliance',
          p: 'Divine Gas only stocks cylinders from licensed brands (K-Gas, Total, etc.). Users must ensure their kitchen is well-ventilated. We reserve the right to refuse refill for damaged or outdated cylinders.'
        },
        {
          h: 'Payment Terms',
          p: 'Payment is due upon delivery after inspection. We support M-Pesa, Card, and Cash. Orders above KES 10,000 may require a small commitment deposit.'
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[80vh]">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            {active.icon}
            <h2 className="text-xl font-black text-slate-800">{active.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
          {active.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                {section.h}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {section.p}
              </p>
            </div>
          ))}
          
          <div className="pt-8 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Last Updated: March 2024 • Divine Gas Ruai Hub
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-colors"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  );
};
