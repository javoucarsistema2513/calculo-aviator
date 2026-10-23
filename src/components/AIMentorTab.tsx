import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { AviatorCandle, CycleStatus } from '../services/aviatorEngine';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIMentorTabProps {
  candles: AviatorCandle[];
  cycle: CycleStatus;
}

export const AIMentorTab: React.FC<AIMentorTabProps> = ({ candles, cycle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá, operador! Sou o seu Assistente e Mentor Oficial Pai do Aviator AI. Estou a todo vapor analisando seu gráfico em tempo real com base nos 6 Módulos de estudo.\n\nVocê pode me perguntar sobre qualquer padrão, pedir um veredito para a próxima rodada ou tirar dúvidas sobre a proteção 1.49x, Regra dos 13 e cálculo de rosas!',
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentCandles: candles,
          cycleStatus: cycle,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao conectar com o Mentor IA');
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Análise calculada. Siga a gestão de banca!',
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Não consegui processar a resposta no momento. Por favor verifique sua conexão ou se a chave GEMINI_API_KEY está disponível.',
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Qual o veredito para a próxima rodada com as velas atuais?',
    'Como funciona a regra do 1.37x com >90% de assertividade?',
    'Explique a Regra dos 13 nas casas ímpares após vela +30x.',
    'Como aplicar a proteção 1.49x com risco zero na segunda aposta?',
    'O que fazer se o gráfico entrar em Ciclo de Recolhe?',
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950"></span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              Pai do Aviator AI <span className="text-rose-500">•</span> Mentor em Tempo Real
            </h3>
            <p className="text-xs text-zinc-400">
              Conhecimento integral dos Módulos I a V e Treinamento Novo
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            Ciclo Atual: <strong className="text-rose-400">{cycle.label}</strong>
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-800 text-rose-400 border border-zinc-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-rose-600 text-white rounded-tr-none'
                  : 'bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-tl-none shadow-md'
              }`}
            >
              {msg.text}
              <div
                className={`text-[10px] mt-1.5 text-right font-mono ${
                  msg.sender === 'user' ? 'text-rose-200' : 'text-zinc-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-rose-400 border border-zinc-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-zinc-950 text-zinc-400 text-xs px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400 animate-spin" />
              <span>O Mentor está calculando a melhor assertividade...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      <div className="px-4 py-2 bg-zinc-950/60 border-t border-zinc-800/80 overflow-x-auto scrollbar-none flex gap-2">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-[11px] text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700/80 whitespace-nowrap transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Pergunte ao Mentor do Aviator (ex: Posso entrar agora? Como calcular a rosa?)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-rose-950/50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
