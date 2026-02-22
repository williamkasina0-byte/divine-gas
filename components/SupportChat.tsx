
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Zap } from 'lucide-react';
import { getChatResponse } from '../services/api';

export const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'Jambo! I am Divine. 🇰🇪\n\nNeed cooking gas? We offer FREE delivery in 15 minutes anywhere in Ruai! We are open every day (Mon-Sun) from 8am to 10pm. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const aiMsg = await getChatResponse(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: aiMsg }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90]">
      {isOpen ? (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-100 overflow-hidden animate-scale-up origin-bottom-right">
          <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Divine Helper</h3>
                <div className="flex items-center gap-1 text-[10px] text-orange-100 uppercase font-black">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Free 15-Min Delivery
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl flex gap-2 ${m.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                  }`}>
                  <div className="mt-1 flex-shrink-0">
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about gas brands or safety..."
                className="flex-1 p-3 bg-slate-100 rounded-xl outline-none focus:ring-2 ring-orange-200 transition-all text-sm"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-orange-500 text-white rounded-full shadow-xl shadow-orange-200 hover:scale-110 transition-transform active:scale-95 group relative"
        >
          <MessageCircle className="w-8 h-8" />
          <div className="absolute -top-14 -left-24 w-40 bg-slate-900 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none transform translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Instant Support</span>
            </div>
            <p className="text-[10px] font-bold text-slate-300">Open 8am - 10pm Daily!</p>
          </div>
        </button>
      )}
    </div>
  );
};
