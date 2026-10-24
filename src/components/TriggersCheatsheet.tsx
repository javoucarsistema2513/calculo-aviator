import React, { useState } from 'react';
import {
  LOW_CANDLE_TRIGGERS,
  PINK_PAIRS,
  CASAMENTO_DECIMAIS
} from '../utils/aviatorCalculations';
import { Search, Flame, KeyRound, Sparkles, BookOpen } from 'lucide-react';

interface TriggersCheatsheetProps {
  onSelectTrigger: (multiplier: number) => void;
}

export const TriggersCheatsheet: React.FC<TriggersCheatsheetProps> = ({ onSelectTrigger }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'todos' | 'especiais' | 'pares' | 'casamentos'>('todos');

  const triggersList = Object.values(LOW_CANDLE_TRIGGERS);

  const filteredTriggers = triggersList.filter((item) => {
    const matchesSearch =
      item.multiplier.toFixed(2).includes(searchTerm) ||
      item.calls.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategory === 'especiais') {
      return [1.00, 1.11, 1.37, 1.88, 1.99, 1.20, 1.28].includes(item.multiplier);
    }
    return true;
  });

  return (
    <div className="bg-[#11121d] rounded-2xl border border-gray-800 p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Catálogo de Gatilhos & Segredos dos Módulos
            </h3>
            <p className="text-[11px] text-gray-400">
              Guia rápido de velas de gatilho, pares de rosas e casamentos de decimais
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar gatilho (ex: 1.37 ou 1.00)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-pink-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 my-3">
        <button
          onClick={() => setActiveCategory('todos')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeCategory === 'todos'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          Todas as Velas Baixas ({triggersList.length})
        </button>
        <button
          onClick={() => setActiveCategory('especiais')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeCategory === 'especiais'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          ⭐ Velas Mestras Especiais (1.37x, 1.88x...)
        </button>
        <button
          onClick={() => setActiveCategory('pares')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeCategory === 'pares'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          🌹 Pares Gatilhos de Rosas ({PINK_PAIRS.length})
        </button>
        <button
          onClick={() => setActiveCategory('casamentos')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeCategory === 'casamentos'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          🔗 Casamento de Decimais
        </button>
      </div>

      {/* Grid of Low Candle Triggers */}
      {activeCategory !== 'pares' && activeCategory !== 'casamentos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredTriggers.map((trig) => (
            <div
              key={trig.multiplier}
              onClick={() => onSelectTrigger(trig.multiplier)}
              className="p-3 rounded-xl bg-gray-900/70 border border-gray-800 hover:border-pink-500/50 hover:bg-gray-850 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-white group-hover:text-pink-400">
                    {trig.multiplier.toFixed(2)}x
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                    {trig.calls}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {trig.strength}%
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 leading-snug">
                {trig.notes}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pares Gatilhos View */}
      {activeCategory === 'pares' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {PINK_PAIRS.map((pair, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-pink-950/20 border border-pink-500/30 text-center"
            >
              <span className="font-mono font-bold text-xs text-pink-300 block">
                {pair}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Puxa Vela Rosa 10x+
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Casamento de Decimais View */}
      {activeCategory === 'casamentos' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CASAMENTO_DECIMAIS.map((cas, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-base text-purple-300">
                  {cas.pair}
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  Casamento
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">{cas.desc}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
