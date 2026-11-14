import React, { useState } from 'react';
import { Target, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface OddsCasasTrackProps {
  lastMultiplier: number;
}

export const OddsCasasTrack: React.FC<OddsCasasTrackProps> = ({ lastMultiplier }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const isResetCandle = lastMultiplier === 1.0 || (lastMultiplier >= 1.0 && lastMultiplier < 1.02);
  const isHighRosa = lastMultiplier >= 30.0;

  // The 13 houses
  const houses = Array.from({ length: 13 }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Rastreador de Casas (Regra dos 13 & Reset)
              {isHighRosa && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Gatilho +30x Detectado!
                </span>
              )}
              {isResetCandle && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Reset 1.00x Detectado!
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isResetCandle
                ? 'Após 1.00x: Paga rosa em até 10 casas (5ª casa é a mais forte do algoritmo)'
                : 'Módulo 4: Após velas 30x+, 95% das rosas pagam nas casas ÍMPARES (1, 3, 5, 7, 9, 11, 13)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reiniciar
        </button>
      </div>

      {/* House Track Steps */}
      <div className="grid grid-cols-7 sm:grid-cols-13 gap-1.5 my-3">
        {houses.map((house) => {
          const isOdd = house % 2 !== 0;
          const isFifth = house === 5;
          const isPast = house < currentStep;
          const isCurrent = house === currentStep;

          let houseStyle = 'bg-slate-950 text-slate-400 border-slate-800';
          let badgeText = '';

          if (isFifth) {
            badgeText = '★ 5ª';
            houseStyle = isCurrent
              ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-500/30 scale-105'
              : 'bg-amber-950/40 text-amber-300 border-amber-500/40 font-bold';
          } else if (isOdd) {
            badgeText = 'Ímpar';
            houseStyle = isCurrent
              ? 'bg-pink-600 text-white font-black border-pink-400 shadow-lg shadow-pink-600/30 scale-105'
              : 'bg-pink-950/30 text-pink-300 border-pink-500/30';
          } else {
            houseStyle = isCurrent
              ? 'bg-purple-600 text-white font-bold border-purple-400'
              : 'bg-slate-950/80 text-slate-500 border-slate-800/80';
          }

          if (isPast) {
            houseStyle = 'bg-slate-900/40 text-slate-600 border-slate-800/40 line-through opacity-60';
          }

          return (
            <button
              key={house}
              onClick={() => setCurrentStep(house)}
              className={`p-2 rounded-xl flex flex-col items-center justify-center border text-center transition-all duration-200 cursor-pointer ${houseStyle}`}
              title={`Casa ${house} - Clique para marcar como rodada atual`}
            >
              <span className="text-xs sm:text-sm font-bold">#{house}</span>
              <span className="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5 truncate">
                {badgeText || (isOdd ? 'Forte' : 'Neutro')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
            Casas Ímpares (95% de assertividade)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            5ª Casa (Pico de repetição)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Rodada atual: <strong>#{currentStep}</strong></span>
          <button
            onClick={() => setCurrentStep((prev) => Math.min(13, prev + 1))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            +1 Rodada
          </button>
        </div>
      </div>
    </div>
  );
};
