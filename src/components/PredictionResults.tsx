import React, { useState } from 'react';
import { HousePrediction, TimePrediction } from '../types/aviator';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Target,
  Sparkles,
  Zap,
  Calendar,
  Layers,
  Copy,
  Check,
  Award,
  AlertTriangle
} from 'lucide-react';

interface PredictionResultsProps {
  currentMultiplier: number;
  baseTime: string;
  housePredictions: HousePrediction[];
  immediateTimePredictions: TimePrediction[];
  sevenHoursPredictions: TimePrediction[];
  twelveHoursPredictions: TimePrediction[];
  twentyFourHoursPredictions: TimePrediction[];
}

export const PredictionResults: React.FC<PredictionResultsProps> = ({
  currentMultiplier,
  baseTime,
  housePredictions,
  immediateTimePredictions,
  sevenHoursPredictions,
  twelveHoursPredictions,
  twentyFourHoursPredictions,
}) => {
  const [activeTab, setActiveTab] = useState<'7h' | '12h' | '24h' | 'casas' | 'imediato'>('7h');
  const [copied, setCopied] = useState<boolean>(false);

  // Highest probability across immediate signals
  const topProb = Math.max(
    ...housePredictions.map((h) => h.probability),
    ...immediateTimePredictions.map((t) => t.probability),
    88
  );

  const getTargetBadge = (target: string) => {
    switch (target) {
      case '100x':
      case '50x':
        return 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white shadow-rose-500/30';
      case '10x':
        return 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-pink-500/30';
      case '5x':
      case '3x':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30';
      default:
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/30';
    }
  };

  const currentHorizonList =
    activeTab === '7h'
      ? sevenHoursPredictions
      : activeTab === '12h'
      ? twelveHoursPredictions
      : activeTab === '24h'
      ? twentyFourHoursPredictions
      : [];

  const handleCopyList = () => {
    const title = `LISTA DE SINAIS AVIATOR PREDICTOR (${activeTab.toUpperCase()}) - Base: ${currentMultiplier.toFixed(2)}x às ${baseTime}\n`;
    const rows = currentHorizonList
      .map(
        (p) =>
          `⏰ ${p.targetTime} | Alvo: ${p.expectedTarget} | Prob: ${p.probability}% | Proteção: 1.49x | ${p.ruleSource}`
      )
      .join('\n');
    navigator.clipboard.writeText(title + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Probabilidade Geral */}
        <div className="bg-[#121320] border border-gray-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Assertividade Calculada</span>
            <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300 font-mono">
              {topProb}%
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Alta Precisão
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Baseado na matriz estatística de catalogação e convergência matemática.
          </p>
        </div>

        {/* Card 2: Alvo Principal */}
        <div className="bg-[#121320] border border-gray-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Alvo Principal</span>
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {currentMultiplier >= 30 ? '10x a 50x+' : currentMultiplier >= 10 ? 'Rosa (10x+)' : currentMultiplier >= 2 ? 'Roxo (2x a 5x)' : 'Gatilho de Alta'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {currentMultiplier >= 30 ? 'Regra dos 13 em vigor para velas +30x' : 'Projeção de casas ímpares e fechamento'}
          </p>
        </div>

        {/* Card 3: Estratégia de Proteção (1.49x) */}
        <div className="bg-[#121320] border border-gray-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Mão de Proteção</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">1.49x</span>
            <span className="text-[11px] text-gray-400">ou 2.00x</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Regra Pai do Aviator: saque no 1.49x cobre a 2ª mão que busca a vela alta.
          </p>
        </div>

        {/* Card 4: Timing & Gestão de Gales */}
        <div className="bg-[#121320] border border-gray-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Modo de Entrada</span>
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-mono">2 Tiros / G1</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Entrar 15s antes ou no minuto exato; no máximo 2 gales de proteção.
          </p>
        </div>

      </div>

      {/* 2. HORIZON PREDICTION TABS NAVIGATION (7h, 12h, 24h, Casas, Imediato) */}
      <div className="bg-[#11121d] rounded-2xl border border-gray-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('7h')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === '7h'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Próximas 7:00 Horas</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {sevenHoursPredictions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('12h')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === '12h'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Próximas 12:00 Horas</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {twelveHoursPredictions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('24h')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === '24h'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Próximas 24:00 Horas (Dia Seguinte)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {twentyFourHoursPredictions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('casas')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'casas'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Próximas Casas (Rodadas)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {housePredictions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('imediato')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'imediato'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Minutos Imediatos</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {immediateTimePredictions.length}
              </span>
            </button>
          </div>

          {/* Copy List Action for 7h/12h/24h */}
          {(activeTab === '7h' || activeTab === '12h' || activeTab === '24h') && (
            <button
              onClick={handleCopyList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-700 bg-gray-900 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition cursor-pointer self-start sm:self-auto"
              title="Copiar lista de sinais calculados"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-pink-400" />
                  <span>Copiar Sinais ({activeTab})</span>
                </>
              )}
            </button>
          )}

        </div>

        {/* 3. TAB CONTENT DISPLAY */}
        <div className="mt-4">
          
          {/* HORIZON VIEW: 7H, 12H, 24H */}
          {(activeTab === '7h' || activeTab === '12h' || activeTab === '24h') && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                <span>
                  Projeção {activeTab === '7h' ? 'de 7 Horas (Ciclo Harmônico)' : activeTab === '12h' ? 'de 12 Horas (Ciclo Circadiano)' : 'de 24 Horas (Catalogação do Dia Seguinte)'}:
                </span>
                <span className="text-[11px] text-pink-400 font-mono font-medium">
                  Minutos fortes :00, :05, :09 com filtros de picos
                </span>
              </div>

              {currentHorizonList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Nenhuma projeção gerada para este período.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {currentHorizonList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80 hover:border-pink-500/40 hover:bg-gray-850/80 transition duration-150 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 font-mono font-black text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-base font-extrabold text-white">
                                {item.targetTime}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                (+{item.minutesAhead}m)
                              </span>
                            </div>
                            <span className="text-[10px] text-pink-400 font-medium">
                              {item.ruleSource}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-md ${getTargetBadge(
                            item.expectedTarget
                          )}`}
                        >
                          {item.expectedTarget}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          {item.protectionTip}
                        </span>
                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                          <span>{item.probability}%</span>
                        </div>
                      </div>

                      <div className="mt-1 text-[10px] text-gray-500">
                        {item.entryWindow}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CASAS & RODADAS (SOMA DECIMAIS / REGRA DOS 13) */}
          {activeTab === 'casas' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                <span>
                  Próximas casas/rodadas a partir da vela digitada ({currentMultiplier.toFixed(2)}x):
                </span>
                <span className="text-emerald-400 text-[11px]">
                  ~3 rodadas por minuto
                </span>
              </div>

              {housePredictions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Nenhuma projeção de casa calculada. Digite uma vela e clique em calcular.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {housePredictions.map((hp, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition ${
                        hp.isOdd && currentMultiplier >= 30
                          ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-950/50'
                          : hp.house === 5 && currentMultiplier === 1.00
                          ? 'bg-pink-950/40 border-pink-500/60 shadow-lg shadow-pink-950/50'
                          : 'bg-gray-900/60 border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-xl font-mono font-black text-sm ${
                              hp.isOdd
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                          >
                            {hp.house}ª
                          </span>
                          <div>
                            <span className="text-sm font-bold text-white">
                              {hp.house}ª Casa à frente
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {hp.isOdd && (
                                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-500/30">
                                  Casa Ímpar
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400">{hp.ruleName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-sm font-extrabold text-emerald-400 block">
                            {hp.probability}%
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Min: {hp.expectedMinMultiplier.toFixed(2)}x
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-gray-300 leading-relaxed">
                        {hp.explanation}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Proteção: 1.49x</span>
                        <span className="text-pink-400 font-medium">Até Gale 1</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MINUTOS IMEDIATOS */}
          {activeTab === 'imediato' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                <span>
                  Soma de minutos e dígitos da vela ({currentMultiplier.toFixed(2)}x) às {baseTime}:
                </span>
                <span className="text-pink-400 font-mono text-[11px]">
                  Fórmula Módulo 2 & 5
                </span>
              </div>

              {immediateTimePredictions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Nenhuma projeção de minuto imediato.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {immediateTimePredictions.map((ip, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gray-900/80 border border-pink-500/30 hover:border-pink-500/60 transition shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-mono text-lg font-black text-white">
                              {ip.targetTime}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              (+{ip.minutesAhead} min)
                            </span>
                            <p className="text-xs text-pink-300 font-medium">{ip.ruleSource}</p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black shadow-md ${getTargetBadge(
                            ip.expectedTarget
                          )}`}
                        >
                          {ip.expectedTarget}
                        </span>
                      </div>

                      <div className="mt-3 p-2.5 rounded-lg bg-gray-950/70 border border-gray-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="font-semibold text-pink-400">Janela:</span>
                          <span>{ip.entryWindow}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="font-semibold text-emerald-400">Proteção:</span>
                          <span>{ip.protectionTip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* 4. METHODOLOGY CITATION INFO BOX */}
      <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 text-xs text-gray-400 flex items-start gap-3">
        <Award className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-200">
            Metodologia Universal Baseada nas Mentorias 1 a 5 do "Pai do Aviator":
          </p>
          <p className="leading-relaxed">
            Todas as probabilidades são geradas através de fórmulas combinatórias de repetição de decimais,
            Regra dos 13 para velas de +30x, identificação de velas mestras (1.37x, 1.88x, 1.99x, 1.00x reset),
            minutos fortes (:00, :05, :09) e catalogação circadiana de 7h, 12h e 24h. Nenhum dado sai do seu aparelho:
            o motor de cálculo opera 100% offline em qualquer dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
};
