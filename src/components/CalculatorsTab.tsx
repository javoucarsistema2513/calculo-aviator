import React, { useState } from 'react';
import {
  calculatePinkSubtraction,
  calculateRoundTime,
  calculateHighMultiplierTime,
  calculateDualBetProtection,
} from '../services/aviatorEngine';
import { Calculator, Clock, Sparkles, ShieldCheck, Flame, Info, Check, ArrowRight } from 'lucide-react';

export const CalculatorsTab: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<
    'pink_subtraction' | 'round_time' | 'high_candles' | 'rule_13' | 'protection'
  >('pink_subtraction');

  // Calc 1 State (Pink Subtraction)
  const [pinkCandleVal, setPinkCandleVal] = useState('15.36');
  const [pinkTime, setPinkTime] = useState('01:05:25');

  // Calc 2 State (Round Time)
  const [roundTimeInput, setRoundTimeInput] = useState('17:33:37');
  const [roundIdInput, setRoundIdInput] = useState('1809347');

  // Calc 3 State (High Candles)
  const [highBaseTime, setHighBaseTime] = useState('14:22');
  const [highTargetType, setHighTargetType] = useState<'2x' | '5x' | '10x' | '50x' | '100x'>('50x');
  const [isNegativeCycle, setIsNegativeCycle] = useState(false);

  // Calc 4 State (Rule of 13)
  const [lastPinkMultiplier, setLastPinkMultiplier] = useState('42.35');
  const [currentHouseOffset, setCurrentHouseOffset] = useState<number>(3);

  // Calc 5 State (Protection & Dual Bet)
  const [totalStake, setTotalStake] = useState('30.00');
  const [targetMultiplier, setTargetMultiplier] = useState('5.00');

  // Pink Calc Result
  const pinkResult = calculatePinkSubtraction(
    parseFloat(pinkCandleVal) || 15.36,
    pinkTime
  );

  // Round Calc Result
  const roundResult = calculateRoundTime(roundTimeInput, roundIdInput);

  // High Candle Calc Result
  const highResult = calculateHighMultiplierTime(highBaseTime, highTargetType, isNegativeCycle);

  // Protection Calc Result
  const protectionResult = calculateDualBetProtection(
    parseFloat(totalStake) || 30,
    parseFloat(targetMultiplier) || 2
  );

  return (
    <div className="space-y-6">
      {/* Calculators Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: 'pink_subtraction', label: '1. Subtração para Rosas', icon: Sparkles },
          { id: 'round_time', label: '2. Cálculo pela Rodada', icon: Clock },
          { id: 'high_candles', label: '3. Projeção de Velas Altas', icon: Flame },
          { id: 'rule_13', label: '4. Regra dos 13 (+30x)', icon: Calculator },
          { id: 'protection', label: '5. Proteção 1.49x & Banca', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCalc === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCalc(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CALCULATOR 1: Subtração de Velas para Rosas */}
      {activeCalc === 'pink_subtraction' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Módulo III & V • Segredo Revelado
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Cálculo de Subtração de Velas para Pegar Rosa (+10x)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Método ensinado no Módulo V (págs. 3 e 4). Subtraem-se os dígitos inteiros e os decimais da vela rosa anterior, e a soma dos resultados aponta exatamente os minutos para a próxima vela rosa!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Vela Rosa Anterior (Ex: 15.36x ou 37.89x)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pinkCandleVal}
                  onChange={(e) => setPinkCandleVal(e.target.value)}
                  placeholder="15.36"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-rose-500"
                />
                <span className="absolute right-4 top-2.5 text-zinc-400 font-mono">x</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Horário em que a vela saiu (HH:MM:SS)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pinkTime}
                  onChange={(e) => setPinkTime(e.target.value)}
                  placeholder="01:05:25"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={() => {
                    const d = new Date();
                    setPinkTime(
                      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
                    );
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl whitespace-nowrap"
                >
                  Agora
                </button>
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-fuchsia-950/40 to-zinc-950 border border-fuchsia-800/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-fuchsia-400">
                PROJEÇÃO MATEMÁTICA DA PRÓXIMA ROSA
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                +{pinkResult.totalMinutesAhead} Minutos à frente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 block mb-1">Horário Previsto da Rosa:</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-fuchsia-400">
                  {pinkResult.targetTime}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-1">Janela de entrada principal</span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 block mb-1">Tolerância Máxima (+1 min):</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {pinkResult.toleranceTime}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-1">Margem de segurança até G1</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 text-xs text-zinc-300 space-y-1 font-mono">
              <div className="text-fuchsia-300 font-bold">Fórmula aplicada dos PDFs:</div>
              <div>{pinkResult.explanation}</div>
              <div className="text-zinc-400 text-[11px] pt-1">
                Dica do Módulo V: Realize entradas até 30 segundos antes com proteção no 1.49x.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: Horário pela Rodada */}
      {activeCalc === 'round_time' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
              <Clock className="w-3.5 h-3.5" /> Módulo II & V • Estratégia de Tempo
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Cálculo por Horário da Vela + Dígito da Rodada
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Método ensinado no Módulo II (pág. 5) e Módulo V (pág. 1). Ao abrir o histórico da rodada da vela roxa, soma-se o último dígito da ID da rodada aos minutos para encontrar o horário da próxima vela 2x ou mais!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                ID da Rodada (Ex: 1809347 ou 4310524)
              </label>
              <input
                type="text"
                value={roundIdInput}
                onChange={(e) => setRoundIdInput(e.target.value)}
                placeholder="1809347"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Último dígito considerado:{' '}
                <strong className="text-blue-400 font-mono">
                  {roundIdInput.trim().slice(-1) || '0'}
                </strong>
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Horário da Rodada (HH:MM:SS)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roundTimeInput}
                  onChange={(e) => setRoundTimeInput(e.target.value)}
                  placeholder="17:33:37"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const d = new Date();
                    setRoundTimeInput(
                      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
                    );
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl whitespace-nowrap"
                >
                  Agora
                </button>
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-zinc-950 border border-blue-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                HORÁRIO CALCULADO PARA PEGAR 2X OU MAIS
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Alvo: 2.00x+
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
              <span className="text-xs text-zinc-400 block mb-1">Entrar exatamente no horário:</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-blue-400">
                {roundResult.targetTime}
              </span>
              <p className="text-xs text-zinc-300 mt-2 font-mono">
                {roundResult.explanation}
              </p>
            </div>

            <div className="text-xs text-zinc-400 bg-zinc-950/90 p-3 rounded-xl border border-zinc-800">
              💡 Observação do Módulo II: "A cada minuto são cerca de 3 rodadas. Entre no minuto exato e realize 2 entradas, ou 15 segundos antes realizando até 3 entradas (G2)."
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 3: Projeção de Velas Altas */}
      {activeCalc === 'high_candles' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <Flame className="w-3.5 h-3.5" /> Módulo IV • Catalogação de Horários
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Projeção de Velas Altas (+3m, +10m, +20m, +30m)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Catalogação estatística ensinada no Módulo IV para buscar multiplicadores de 2x, 5x, 10x e as cobiçadas velas de 50x e 100x.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Vela Alvo Desejada
              </label>
              <select
                value={highTargetType}
                onChange={(e) => setHighTargetType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              >
                <option value="2x">Buscar 2X (+3 minutos)</option>
                <option value="5x">Buscar 5X (+10 minutos)</option>
                <option value="10x">Buscar 10X (+20 minutos)</option>
                <option value="50x">Buscar 50X (+30 minutos)</option>
                <option value="100x">Buscar 100X (+30/+35 minutos)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Horário da Vela Base (HH:MM)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={highBaseTime}
                  onChange={(e) => setHighBaseTime(e.target.value)}
                  placeholder="14:22"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    const d = new Date();
                    setHighBaseTime(
                      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                    );
                  }}
                  className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Agora
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Comportamento do Ciclo
              </label>
              <button
                type="button"
                onClick={() => setIsNegativeCycle(!isNegativeCycle)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  isNegativeCycle
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isNegativeCycle ? 'Ciclo Negativo (+32m / +35m)' : 'Ciclo Positivo (+30m Normal)'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
              HORÁRIOS PREVISTOS PARA ENTRADA
            </span>

            <div className="flex flex-wrap gap-3">
              {highResult.targetTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-center flex-1 min-w-[130px]"
                >
                  <span className="text-[11px] text-zinc-400 block">
                    {idx === 0 ? '1ª Tentativa' : idx === 1 ? '2ª Tentativa (+10m)' : '3ª Tentativa (+10m)'}
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-400 mt-0.5 block">
                    {time}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs text-zinc-300 space-y-2 pt-2 border-t border-zinc-800/80">
              <p>📌 <strong>Regra:</strong> {highResult.ruleExplanation}</p>
              <p>🎯 <strong>Como entrar:</strong> {highResult.entryWindowText}</p>
              <p className="text-[11px] text-zinc-400">
                Aviso do Módulo IV: "Nunca faça mais de 3 acréscimos de 10 minutos! Se não pagou em 3 tentativas, pule para a próxima vela base para não quebrar a banca."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 4: Regra dos 13 */}
      {activeCalc === 'rule_13' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
              <Calculator className="w-3.5 h-3.5" /> Módulo IV (pág. 48-49)
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Regra dos 13 (Velas +30x com 95% nas Casas Ímpares)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              "Quando sair uma vela alta no Aviator +30x, a plataforma precisa pagar outra vela alta em até 13 casas. Cerca de 95% das vezes puxam em CASAS DE NÚMEROS ÍMPARES (1, 3, 5, 7, 9, 11, 13)."
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Vela Alta Base (Ex: 42.35x, 67.01x, 103.72x)
              </label>
              <input
                type="text"
                value={lastPinkMultiplier}
                onChange={(e) => setLastPinkMultiplier(e.target.value)}
                placeholder="42.35"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Quantas rodadas já se passaram desde essa vela?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="13"
                  value={currentHouseOffset}
                  onChange={(e) => setCurrentHouseOffset(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <span className="w-10 text-center font-mono font-bold text-white text-sm">
                  {currentHouseOffset}
                </span>
              </div>
            </div>
          </div>

          {/* Houses Map */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
              MAPA DAS 13 CASAS PÓS-VELA ALTA:
            </span>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((houseNum) => {
                const isOdd = houseNum % 2 !== 0;
                const isCurrent = houseNum === currentHouseOffset;
                const isPast = houseNum < currentHouseOffset;

                return (
                  <div
                    key={houseNum}
                    className={`p-2.5 rounded-xl text-center border transition ${
                      isCurrent
                        ? 'ring-2 ring-rose-500 bg-rose-600/30 border-rose-500'
                        : isPast
                        ? 'opacity-40 bg-zinc-900 border-zinc-800'
                        : isOdd
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-zinc-400">
                      Casa {houseNum}
                    </div>
                    <div className="font-mono font-black text-sm mt-0.5">
                      {isOdd ? 'ÍMPAR' : 'PAR'}
                    </div>
                    {isOdd && (
                      <span className="text-[9px] font-black text-emerald-400 block mt-0.5">
                        95% Forte
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] font-black text-white bg-rose-600 rounded px-1 mt-1 block">
                        AGORA
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 text-xs text-zinc-300 mt-2">
              {currentHouseOffset % 2 !== 0 ? (
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Rodada atual ({currentHouseOffset}ª) é ÍMPAR! Momento de alta assertividade para buscar vela 10x a 18x+.
                </div>
              ) : (
                <div className="text-zinc-400">
                  Rodada atual ({currentHouseOffset}ª) é PAR. A mentoria recomenda aguardar a próxima casa ímpar ({currentHouseOffset + 1}ª) para entrada de peso.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 5: Proteção 1.49x & Dupla Aposta */}
      {activeCalc === 'protection' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Módulo IV (pág. 18) & V (pág. 16-17)
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Calculadora de Proteção 1.49x & Dupla Aposta
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              "Sempre saia em 1.49x se tiver colocado duas vezes o valor da segunda entrada. Pois mesmo que a segunda entrada você tome red, a primeira cobriu a segunda, assim você protege sua banca!"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Valor Total a Investir na Rodada (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 font-mono">R$</span>
                <input
                  type="number"
                  step="1"
                  min="3"
                  value={totalStake}
                  onChange={(e) => setTotalStake(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Multiplicador Alvo da 2ª Caixa
              </label>
              <select
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="2.00">2.00x (Dobrar Valor - Conservador)</option>
                <option value="3.00">3.00x (Triplicar)</option>
                <option value="5.00">5.00x (Vela Roxa Alta)</option>
                <option value="10.00">10.00x (Vela Rosa)</option>
                <option value="30.00">30.00x (Super Rosa)</option>
              </select>
            </div>
          </div>

          {/* Division preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Protection */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Caixa 1 • Proteção
                </span>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                  Auto-Retirada: 1.49x
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-white">
                R$ {protectionResult.protectionBet.toFixed(2)}
              </div>
              <p className="text-xs text-zinc-400">
                Se o avião bater 1.49x, você recebe{' '}
                <strong className="text-emerald-400">R$ {protectionResult.protectionPayout.toFixed(2)}</strong>.
                Isso cobre o total investido de R$ {parseFloat(totalStake || '0').toFixed(2)}!
              </p>
            </div>

            {/* Box 2: Target */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-rose-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Caixa 2 • Alvo de Lucro
                </span>
                <span className="text-xs font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded">
                  Alvo: {parseFloat(targetMultiplier).toFixed(2)}x
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-white">
                R$ {protectionResult.targetBet.toFixed(2)}
              </div>
              <p className="text-xs text-zinc-400">
                Lucro potencial se ambas as caixas baterem:{' '}
                <strong className="text-rose-400">
                  +R$ {protectionResult.totalProfitWhenBothHit.toFixed(2)}
                </strong>{' '}
                líquido!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
            {protectionResult.strategySummary}
          </div>
        </div>
      )}
    </div>
  );
};
