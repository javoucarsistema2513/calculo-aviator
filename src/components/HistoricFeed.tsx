import React, { useState } from 'react';
import { Candle, DetectedPattern } from '../types/aviator';
import { getCandleType, formatTime } from '../utils/aviatorCalculations';
import { Plus, Trash2, RefreshCw, AlertCircle, Sparkles, Activity } from 'lucide-react';

interface HistoricFeedProps {
  candles: Candle[];
  detectedPatterns: DetectedPattern[];
  onSelectCandle: (candle: Candle) => void;
  onAddCandle: (multiplier: number, time?: string) => void;
  onClearHistory: () => void;
  onResetToDemoHistory: () => void;
}

export const HistoricFeed: React.FC<HistoricFeedProps> = ({
  candles,
  detectedPatterns,
  onSelectCandle,
  onAddCandle,
  onClearHistory,
  onResetToDemoHistory,
}) => {
  const [quickAddVal, setQuickAddVal] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickAddVal.replace(',', '.'));
    if (!isNaN(val) && val >= 1.00) {
      onAddCandle(val);
      setQuickAddVal('');
      setShowAddForm(false);
    }
  };

  const getPillBadge = (multiplier: number) => {
    const type = getCandleType(multiplier);
    switch (type) {
      case 'rosa_alta':
        return 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white border-pink-300 shadow-md shadow-pink-600/40 ring-1 ring-pink-300';
      case 'rosa':
        return 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400 shadow-sm shadow-pink-600/30';
      case 'roxo':
        return 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-purple-400';
      default:
        return 'bg-gradient-to-r from-sky-700 to-blue-700 text-cyan-100 border-sky-400';
    }
  };

  return (
    <div className="bg-[#11121d] rounded-2xl border border-gray-800 p-4 shadow-xl">
      
      {/* Header with Pattern Alerts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-bold text-white">Histórico de Rodadas</h3>
          <span className="text-[11px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
            {candles.length} velas
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Vela</span>
          </button>

          <button
            onClick={onResetToDemoHistory}
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 text-xs transition cursor-pointer"
            title="Restaurar histórico demonstrativo dos PDFs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-rose-400 border border-gray-800 text-xs transition cursor-pointer"
            title="Limpar histórico"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Add Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="my-3 p-3 rounded-xl bg-gray-950/80 border border-pink-500/30 flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Digite o multiplicador (ex: 2.45 ou 15.20)"
            value={quickAddVal}
            onChange={(e) => setQuickAddVal(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold outline-none focus:border-pink-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Visual Round Feed (Aviator bar style) */}
      <div className="mt-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
          {candles.slice(0, 30).map((candle) => (
            <button
              key={candle.id}
              onClick={() => onSelectCandle(candle)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition transform hover:scale-105 active:scale-95 cursor-pointer ${getPillBadge(
                candle.multiplier
              )}`}
              title={`Clique para analisar esta vela: ${candle.multiplier.toFixed(2)}x às ${candle.time}`}
            >
              {candle.multiplier.toFixed(2)}x
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Dica: Clique em qualquer pílula acima para recalcular imediatamente a partir daquela vela.
        </p>
      </div>

      {/* Real-time Pattern Recognitions detected in this feed */}
      {detectedPatterns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Padrões Detectados no Gráfico Atual ({detectedPatterns.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {detectedPatterns.map((pat, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs ${
                  pat.severity === 'high'
                    ? 'bg-pink-950/30 border-pink-500/40 text-pink-200'
                    : 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-pink-400" />
                    {pat.name}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400">
                    {pat.confidence}% Conf.
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-300 leading-snug">
                  {pat.description}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold pt-1 border-t border-white/10">
                  <span className="text-gray-400">{pat.recommendedAction}</span>
                  <span className="text-pink-300 font-mono">Alvo: {pat.exitTarget}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
