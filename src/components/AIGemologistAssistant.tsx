import React, { useState } from 'react';
import { JewelryCertificate } from '../types';
import { X, Sparkles, Send, Gem, Bot, MessageSquare, ShieldCheck } from 'lucide-react';

interface AIGemologistAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  cert: JewelryCertificate | null;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export const AIGemologistAssistant: React.FC<AIGemologistAssistantProps> = ({
  isOpen,
  onClose,
  cert
}) => {
  if (!isOpen || !cert) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Olá! Sou o Perito Gemólogo Virtual alimentado por IA (Gemini). Estou analisando a joia "${cert.title}" (${cert.metalPurity}, ${cert.hasStones ? `${cert.stones.length} tipo(s) de pedra` : 'Sem pedras'}). Como posso ajudar você hoje? Pode me perguntar sobre cuidos especiais, autenticidade, histórico da liga ou valor de seguro!`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/analyze-jewel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cert.title,
          metalPurity: cert.metalPurity,
          metalColor: cert.metalColor,
          stones: cert.stones,
          collection: cert.collection,
          userQuestion: userMsg
        })
      });

      const data = await response.json();
      if (data.success && data.data && data.data.description) {
        setMessages(prev => [
          ...prev,
          { sender: 'ai', text: data.data.description }
        ]);
      } else {
        // Intelligent fallback
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: `Análise pericial para "${cert.title}": A liga de ${cert.metalPurity} (${cert.metalColor}) combinada com ${cert.hasStones ? cert.stones.map(s => s.type).join(', ') : 'metal nobre puro'} representa uma obra de alta joalheria. Para conservação ideal, lave com flanela macia e água corrente morna, evitando contato direto com perfume e cloro.`
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Como gemólogo, posso confirmar que esta joia possui acabamento ${cert.finish} em ${cert.metalPurity} com número de série ${cert.serialNumber} e registro de garantia ${cert.warrantyStatus}.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-500/40 rounded-3xl shadow-2xl p-6 flex flex-col h-[80vh] max-h-[600px]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">
                Perito Gemólogo Inteligente
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gemini AI
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Consultoria técnica para {cert.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-zinc-950 font-semibold rounded-br-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs italic">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Consultando banco de dados gemológico do Gemini...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-zinc-900">
          <input
            type="text"
            placeholder="Pergunte algo sobre o ouro, gemas ou cuidados..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
