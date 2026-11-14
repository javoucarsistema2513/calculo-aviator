import React, { useState } from 'react';
import { X, Search, Sparkles, BookOpen, ArrowRight, Zap, Target } from 'lucide-react';
import { TRIGGER_CANDLES_DATABASE, SPECIAL_PAIRS_CATALOG } from '../utils/triggerList';
import { TriggerCandle } from '../types';

interface TriggerCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrigger: (candle: number) => void;
}

export const TriggerCatalogModal: React.FC<TriggerCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectTrigger,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'candles' | 'pairs' | 'rules'>('candles');

  if (!isOpen) return null;

  const filteredCandles = TRIGGER_CANDLES_DATABASE.filter(
    (c) =>
      c.candle.toString().includes(search) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Catálogo de Velas Gatilho & Regras (PDFs)
              </h2>
              <p className="text-xs text-slate-400">
                Padrões catalogados do Módulo 1 ao 5 do &quot;Pai do Aviator&quot;
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('candles')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeTab === 'candles'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Velas Especiais ({TRIGGER_CANDLES_DATABASE.length})
          </button>
          <button
            onClick={() => setActiveTab('pairs')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeTab === 'pairs'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pares Gatilho ({SPECIAL_PAIRS_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeTab === 'rules'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Regras Principais
          </button>
        </div>

        {/* Search Bar for Candles */}
        {activeTab === 'candles' && (
          <div className="p-3 border-b border-slate-800 bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por vela (ex: 1.37, 1.88, 1.00) ou regra..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {activeTab === 'candles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCandles.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-pink-500/40 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg font-black text-pink-400 group-hover:text-pink-300">
                        {item.candle.toFixed(2)}x
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.module}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mb-1">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Gera: <strong className="text-slate-300">{item.payoutExpectation}</strong> ({item.houses} casas)
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTrigger(item.candle);
                      onClose();
                    }}
                    className="w-full py-1.5 text-xs font-semibold rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <span>Usar esta vela</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pairs' && (
            <div className="space-y-2.5">
              {SPECIAL_PAIRS_CATALOG.map((pair, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/30 flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{pair.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-purple-900/40 text-purple-300">
                        {pair.rule}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{pair.target}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  1. Regra do Dígito da Rodada (Módulo 5, pág 2 & Módulo 2)
                </h4>
                <p className="text-slate-400 mb-1">
                  Pegue o último dígito do ID da rodada atual e some como minutos à hora exata da vela.
                </p>
                <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-emerald-300">
                  Exemplo: Rodada #...875 (final 5) às 14:10 ➔ 14:10 + 5 min = 14:15h (Vela Roxa/Rosa).
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-pink-300 text-sm mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-pink-400" />
                  2. Regra da Subtração de Velas (Módulo 5, pág 4)
                </h4>
                <p className="text-slate-400 mb-1">
                  Pegue duas velas: calcule |B - A| e |D - C| dos decimais. A soma dos resultados é o minuto exato da vela rosa futura.
                </p>
                <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-pink-300">
                  Exemplo: Velas 2.37x e 1.84x ➔ |3-2|=1 e |8-4|=4 ➔ 1 + 4 = 5 minutos à frente para Rosa!
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  3. Super Velas 100x+ (Módulo 4, pág 33-41)
                </h4>
                <p className="text-slate-400 mb-1">
                  Após vela de 60x a 100x+: o algoritmo repete o ciclo com <strong>+30 minutos</strong> (padrão positivo). Se estiver atrasado (padrão negativo), busca em <strong>+32 min</strong> e <strong>+35 min</strong>. Se falhar, busca recuperação com <strong>+10 min</strong> até 3 tentativas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-rose-300 text-sm mb-1">
                  4. Regra dos 13 (Módulo 4, pág 48)
                </h4>
                <p className="text-slate-400">
                  Após velas de 30x+, 95% das velas rosas pagam nas casas ímpares (1, 3, 5, 7, 9, 11, 13). A 5ª casa possui o maior índice de assertividade histórico.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
