import React, { useState } from 'react';
import { Copy, Check, Sparkles, Clock, Target, AlertCircle, ShieldAlert } from 'lucide-react';
import { FutureSignal } from '../types';

interface PredictionCardProps {
  signal: FutureSignal;
  onCopyText?: (text: string) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ signal, onCopyText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `🎯 [SINAL ${signal.targetMultiplier}] 
⏰ Horário: ${signal.targetTime} (Janela: ${signal.window})
📊 Regra: ${signal.ruleName}
🛡️ Proteção: ${signal.protection}
🏠 Entrar na Casa: ${signal.recommendedHouses.join(', ')}`;

    if (onCopyText) {
      onCopyText(textToCopy);
    } else {
      navigator.clipboard.writeText(textToCopy);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTheme = () => {
    switch (signal.type) {
      case 'super':
        return {
          border: 'border-amber-500/50 hover:border-amber-400',
          bg: 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/40',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-amber-500/20 shadow-lg',
          multiplierColor: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200 font-black',
          timeColor: 'text-amber-300',
          accent: 'from-amber-500/20 to-rose-500/10',
          glow: 'shadow-lg shadow-amber-500/10'
        };
      case 'rosa':
        return {
          border: 'border-pink-500/40 hover:border-pink-400',
          bg: 'bg-gradient-to-br from-pink-950/30 via-slate-900 to-slate-900',
          badgeBg: 'bg-pink-600/90 text-white shadow-pink-500/20 shadow-md',
          multiplierColor: 'text-pink-400 font-extrabold',
          timeColor: 'text-pink-300',
          accent: 'from-pink-500/20 to-purple-500/10',
          glow: 'shadow-md shadow-pink-500/10'
        };
      case 'roxa':
      default:
        return {
          border: 'border-purple-500/40 hover:border-purple-400',
          bg: 'bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900',
          badgeBg: 'bg-purple-600/90 text-white shadow-purple-500/20 shadow-md',
          multiplierColor: 'text-purple-400 font-bold',
          timeColor: 'text-purple-300',
          accent: 'from-purple-500/20 to-indigo-500/10',
          glow: 'shadow-md shadow-purple-500/10'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${theme.border} ${theme.bg} ${theme.glow} backdrop-blur-sm`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${theme.badgeBg}`}>
            {signal.badge}
          </span>
          {signal.confidence === 'maxima' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Sparkles className="w-3 h-3" /> Alta Probabilidade
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
              Confirmada
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
          title="Copiar este sinal"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Main Stats: Time & Multiplier */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 mb-3">
        <div>
          <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Horário Previsto</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.timeColor}`}>
              {signal.targetTime}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">({signal.window})</span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            <Target className="w-3 h-3 text-slate-500" />
            <span>Alvo Estimado</span>
          </div>
          <div className={`text-2xl sm:text-3xl tracking-tight ${theme.multiplierColor}`}>
            {signal.targetMultiplier}
          </div>
        </div>
      </div>

      {/* Formula & Rule explanation */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-1.5 text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-200">{signal.ruleName}</p>
            <p className="text-[11px] text-slate-400">{signal.calculationDetails}</p>
          </div>
        </div>

        {/* Houses & Protection */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">Regra das Casas:</span>
            <span className="font-semibold text-slate-200">
              Casas: {signal.recommendedHouses.join(', ')}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
              <ShieldAlert className="w-3 h-3" />
              <span>Proteção:</span>
            </div>
            <span className="font-semibold text-slate-200">{signal.protection}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
