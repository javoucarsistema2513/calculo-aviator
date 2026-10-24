import React, { useState } from 'react';
import { getCandleType, formatTime, PDF_EXAMPLES } from '../utils/aviatorCalculations';
import { Calculator, Flame, RotateCcw, Clock, Hash, HelpCircle, ArrowRight } from 'lucide-react';

interface CandleInputProps {
  currentMultiplier: number;
  currentTime: string;
  currentRoundId: string;
  onCalculate: (multiplier: number, time: string, roundId?: string) => void;
  onClear: () => void;
}

export const CandleInput: React.FC<CandleInputProps> = ({
  currentMultiplier,
  currentTime,
  currentRoundId,
  onCalculate,
  onClear,
}) => {
  const [multiplierInput, setMultiplierInput] = useState<string>(
    currentMultiplier > 0 ? currentMultiplier.toString() : '10.75'
  );
  const [timeInput, setTimeInput] = useState<string>(
    currentTime || formatTime(new Date())
  );
  const [roundIdInput, setRoundIdInput] = useState<string>(currentRoundId || '');
  const [showPresets, setShowPresets] = useState<boolean>(false);

  const numVal = parseFloat(multiplierInput.replace(',', '.')) || 0;
  const candleType = numVal > 0 ? getCandleType(numVal) : 'rosa';

  const handleUseCurrentTime = () => {
    const now = new Date();
    const formatted = formatTime(now);
    setTimeInput(formatted);
  };

  const handleQuickCandle = (val: number) => {
    setMultiplierInput(val.toString());
    onCalculate(val, timeInput, roundIdInput);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (numVal > 0) {
      onCalculate(numVal, timeInput, roundIdInput);
    }
  };

  const getPillStyle = () => {
    switch (candleType) {
      case 'rosa_alta':
        return 'from-fuchsia-600 via-pink-500 to-rose-500 text-white shadow-pink-500/40 border-pink-300';
      case 'rosa':
        return 'from-pink-600 to-rose-600 text-white shadow-pink-600/30 border-pink-400';
      case 'roxo':
        return 'from-purple-600 to-indigo-600 text-white shadow-purple-600/30 border-purple-400';
      default:
        return 'from-blue-600 to-cyan-600 text-white shadow-blue-600/30 border-blue-400';
    }
  };

  return (
    <div className="bg-[#11121d] rounded-2xl border border-gray-800/80 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none ${
        candleType === 'rosa' || candleType === 'rosa_alta' ? 'bg-pink-500' : candleType === 'roxo' ? 'bg-purple-500' : 'bg-blue-500'
      }`} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-ping" />
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Entrada de Vela Recente
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-mono">
              Universal
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Digite a vela que acabou de sair (Rosa ou Roxa) para disparar os algoritmos de probabilidade.
          </p>
        </div>

        {/* Quick Example Presets Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-700 bg-gray-900/80 text-xs font-medium text-pink-400 hover:text-pink-300 hover:border-pink-500/40 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showPresets ? 'Ocultar Exemplos' : 'Ver Exemplos dos PDFs'}</span>
          </button>
        </div>
      </div>

      {/* PDF Reference Presets Shelf */}
      {showPresets && (
        <div className="my-3 p-3.5 rounded-xl bg-gray-950/70 border border-pink-500/20 text-xs animate-in fade-in duration-200">
          <p className="font-semibold text-pink-300 mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            Exemplos Reais Extraídos dos Módulos 1 a 5:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {PDF_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMultiplierInput(ex.multiplier.toString());
                  setTimeInput(ex.time);
                  setRoundIdInput(ex.roundId);
                  onCalculate(ex.multiplier, ex.time, ex.roundId);
                }}
                className="text-left p-2.5 rounded-lg bg-gray-900/90 border border-gray-800 hover:border-pink-500/50 hover:bg-gray-850 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span className="text-pink-400 group-hover:text-pink-300">{ex.name}</span>
                  <span className="font-mono text-emerald-400 font-extrabold">{ex.multiplier.toFixed(2)}x</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{ex.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
        
        {/* Multiplier Input with visual preview */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
            <span>Multiplicador da Vela (X):</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              candleType === 'rosa' || candleType === 'rosa_alta' 
                ? 'bg-pink-950/60 text-pink-400 border-pink-500/30'
                : candleType === 'roxo'
                ? 'bg-purple-950/60 text-purple-400 border-purple-500/30'
                : 'bg-blue-950/60 text-blue-400 border-blue-500/30'
            }`}>
              {candleType === 'rosa_alta' ? 'ROSA ALTA (+50X)' : candleType === 'rosa' ? 'ROSA (+10X)' : candleType === 'roxo' ? 'ROXO (2X-9.99X)' : 'AZUL (<2X)'}
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={multiplierInput}
              onChange={(e) => setMultiplierInput(e.target.value)}
              placeholder="Ex: 10.75 ou 2.31"
              className="w-full bg-[#181a28] border border-gray-700/80 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-lg font-mono font-bold text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-pink-500/20"
            />
            {numVal > 0 && (
              <div className={`absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-gradient-to-r text-xs font-black shadow-md border ${getPillStyle()}`}>
                {numVal.toFixed(2)}x
              </div>
            )}
          </div>
        </div>

        {/* Time Input with "Hora Atual" helper */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Horário da Vela:
            </span>
            <button
              type="button"
              onClick={handleUseCurrentTime}
              className="text-[10px] text-pink-400 hover:text-pink-300 underline cursor-pointer"
            >
              Agora
            </button>
          </label>
          <input
            type="text"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            placeholder="HH:mm:ss"
            className="w-full bg-[#181a28] border border-gray-700/80 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {/* Round ID Input (Optional from Spribe Provably Fair) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-gray-400" />
            <span>ID Rodada (Opc.):</span>
          </label>
          <input
            type="text"
            value={roundIdInput}
            onChange={(e) => setRoundIdInput(e.target.value)}
            placeholder="Ex: 4310619"
            className="w-full bg-[#181a28] border border-gray-700/80 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 outline-none transition"
          />
        </div>

        {/* Action Buttons: Calculate and Clear */}
        <div className="md:col-span-3 flex items-center gap-2">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 py-3 px-4 font-bold text-sm text-white shadow-lg shadow-pink-600/30 border border-pink-400/40 active:scale-95 transition cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Calcular</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMultiplierInput('');
              onClear();
            }}
            className="p-3 rounded-xl border border-gray-800 bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            title="Limpar campos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </form>

      {/* Quick Click Multiplier Shortcuts */}
      <div className="mt-3.5 pt-3 border-t border-gray-850 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-gray-400 mr-1">Atalhos rápidos:</span>
        <button
          type="button"
          onClick={() => handleQuickCandle(2.31)}
          className="px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 font-mono text-xs font-semibold transition cursor-pointer"
        >
          2.31x (Roxa)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(5.52)}
          className="px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 font-mono text-xs font-semibold transition cursor-pointer"
        >
          5.52x (Roxo Alto)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(10.75)}
          className="px-2.5 py-1 rounded-lg bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 font-mono text-xs font-semibold transition cursor-pointer"
        >
          10.75x (Rosa)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(15.36)}
          className="px-2.5 py-1 rounded-lg bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 font-mono text-xs font-semibold transition cursor-pointer"
        >
          15.36x (Rosa)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(37.89)}
          className="px-2.5 py-1 rounded-lg bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 font-mono text-xs font-semibold transition cursor-pointer"
        >
          37.89x (Alta)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(100.62)}
          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-pink-900/60 to-purple-900/60 hover:from-pink-800/70 border border-pink-400/40 text-pink-200 font-mono text-xs font-bold transition cursor-pointer"
        >
          100.62x (Topo)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(1.37)}
          className="px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition cursor-pointer"
        >
          1.37x (Mestra)
        </button>
        <button
          type="button"
          onClick={() => handleQuickCandle(1.00)}
          className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-mono text-xs font-bold transition cursor-pointer"
        >
          1.00x (Reset)
        </button>
      </div>

    </div>
  );
};
