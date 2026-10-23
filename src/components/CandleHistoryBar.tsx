import React, { useState } from 'react';
import {
  AviatorCandle,
  CycleStatus,
  getCandleColor,
  SAMPLE_PRESETS,
} from '../services/aviatorEngine';
import { Plus, Trash2, BookOpen, AlertTriangle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface CandleHistoryBarProps {
  candles: AviatorCandle[];
  cycle: CycleStatus;
  onAddCandle: (value: number) => void;
  onRemoveCandle: (id: string) => void;
  onClearCandles: () => void;
  onLoadPreset: (presetCandles: AviatorCandle[]) => void;
}

export const CandleHistoryBar: React.FC<CandleHistoryBarProps> = ({
  candles,
  cycle,
  onAddCandle,
  onRemoveCandle,
  onClearCandles,
  onLoadPreset,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputValue.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      onAddCandle(val);
      setInputValue('');
    }
  };

  const quickValues = [1.00, 1.37, 1.88, 1.95, 2.50, 5.00, 15.00];

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3.5">
      {/* Top row: Cycle status and stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        {/* Cycle indicator */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              cycle.type === 'PAGUE'
                ? 'bg-emerald-400'
                : cycle.type === 'RECOLHE'
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  cycle.type === 'PAGUE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : cycle.type === 'RECOLHE'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {cycle.label}
              </span>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                {cycle.isSafeToTrade ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Bom para operar
                  </span>
                ) : cycle.type === 'RECOLHE' ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Alerta de Recolhe (Pausa)
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Modo Cauteloso
                  </span>
                )}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
              {cycle.recommendation}
            </p>
          </div>
        </div>

        {/* Proportions */}
        <div className="flex items-center gap-3 text-xs bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-zinc-400 font-medium">Azul:</span>
            <span className="font-bold text-blue-400">{cycle.bluePercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="text-zinc-400 font-medium">Roxo:</span>
            <span className="font-bold text-purple-400">{cycle.purplePercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span className="text-zinc-400 font-medium">Rosa:</span>
            <span className="font-bold text-rose-400">{cycle.pinkPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stream of candles (Most recent on the right with marker) */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 px-1">
          <span>Histórico de Rodadas (Clique para remover uma vela)</span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {candles.length} velas registradas • Última à direita 👉
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto p-2 bg-zinc-950/80 rounded-xl border border-zinc-800/80 scrollbar-thin scrollbar-thumb-zinc-700 min-h-[56px]">
          {candles.length === 0 ? (
            <div className="w-full text-center py-2 text-xs text-zinc-500">
              Nenhuma vela registrada. Adicione manualmente abaixo, envie um print ou carregue um exemplo dos estudos.
            </div>
          ) : (
            candles.map((candle, idx) => {
              const isLast = idx === candles.length - 1;
              return (
                <button
                  key={candle.id}
                  onClick={() => onRemoveCandle(candle.id)}
                  title="Clique para excluir esta vela"
                  className={`group relative shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-black font-mono transition transform hover:scale-105 active:scale-95 cursor-pointer ${
                    candle.color === 'blue'
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/50'
                      : candle.color === 'purple'
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50'
                      : 'bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white shadow-md shadow-rose-900/50 border border-rose-400/60'
                  } ${isLast ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-zinc-950' : ''}`}
                >
                  {candle.value.toFixed(2)}x
                  {isLast && (
                    <span className="absolute -top-2.5 -right-1 px-1 rounded bg-rose-600 text-[8px] font-black text-white uppercase tracking-tighter">
                      Atual
                    </span>
                  )}
                  <span className="hidden group-hover:block absolute inset-0 bg-red-950/90 text-red-200 text-[9px] rounded-lg items-center justify-center pt-1 font-bold">
                    ✕
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Input row + Quick chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 1.37 ou 2.50"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-36 sm:w-44 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
            <span className="absolute right-3 top-1.5 text-zinc-400 font-mono text-sm">x</span>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </form>

        {/* Quick click chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Rápido:</span>
          {quickValues.map((qv) => {
            const col = getCandleColor(qv);
            return (
              <button
                key={qv}
                onClick={() => onAddCandle(qv)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  col === 'blue'
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60 hover:bg-blue-900/60'
                    : col === 'purple'
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                }`}
              >
                +{qv.toFixed(2)}x
              </button>
            );
          })}
        </div>

        {/* Presets and clear */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative group">
            <button
              className="flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-xl border border-zinc-700 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>Exemplos dos PDFs</span>
            </button>
            <div className="absolute right-0 bottom-full mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 hidden group-hover:block z-30">
              <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 border-b border-zinc-800 mb-1">
                Carregar Padrões Reais:
              </div>
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => onLoadPreset(preset.candles)}
                  className="w-full text-left p-2 rounded-lg hover:bg-zinc-800 text-xs transition block"
                >
                  <div className="font-bold text-white">{preset.name}</div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {candles.length > 0 && (
            <button
              onClick={onClearCandles}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
              title="Limpar histórico"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
