import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export const BancaMetasView: React.FC = () => {
  const [banca, setBanca] = useState('200');
  const [metaDiariaPct, setMetaDiariaPct] = useState('15');
  const [stopLossPct, setStopLossPct] = useState('20');
  const [handTwoStake, setHandTwoStake] = useState('5');
  const [modeEqual, setModeEqual] = useState(false);

  const bancaVal = Math.max(0, parseFloat(banca.replace(',', '.')) || 0);
  const metaPct = Math.max(0, parseFloat(metaDiariaPct.replace(',', '.')) || 0);
  const lossPct = Math.max(0, parseFloat(stopLossPct.replace(',', '.')) || 0);
  const baseStake = Math.max(0, parseFloat(handTwoStake.replace(',', '.')) || 0);

  const stopWinValue = (bancaVal * metaPct) / 100;
  const stopLossValue = (bancaVal * lossPct) / 100;
  const monthlyProjection = stopWinValue * 30;

  // Módulo 5 p.17: 1ª mão 2x o valor da 2ª saindo em 1.49x; ou mão igual saindo em 2.00x
  const handOneStake = modeEqual ? baseStake : baseStake * 2;
  const handOneExit = modeEqual ? 2.0 : 1.49;
  const handOneProfit = handOneStake * (handOneExit - 1);
  const totalRiskIfLossBoth = handOneStake + baseStake;
  const netIfOnlyHand1Hits = handOneProfit - baseStake;
  const netIfHand2Hits5x = handOneProfit + baseStake * (5 - 1);
  const netIfHand2Hits10x = handOneProfit + baseStake * (10 - 1);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-slate-50">
          Gestão de Banca, Metas & Proteção 1.49x
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gerenciamento oficial dos Módulos 1, 4 e 5: pense em porcentagem e proteja a segunda entrada antes de buscar velas altas.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Stop Win / Stop Loss & Tabela de Metas */}
        <section className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-100">
            Calculadora Stop Win & Stop Loss
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="banca-val" className="block text-xs font-medium text-slate-300 mb-1.5">
                Banca Atual (R$)
              </label>
              <input
                id="banca-val"
                type="text"
                inputMode="decimal"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="meta-pct" className="block text-xs font-medium text-slate-300 mb-1.5">
                Meta Diária (%)
              </label>
              <input
                id="meta-pct"
                type="text"
                inputMode="decimal"
                value={metaDiariaPct}
                onChange={(e) => setMetaDiariaPct(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="stop-pct" className="block text-xs font-medium text-slate-300 mb-1.5">
                Stop Loss (%)
              </label>
              <input
                id="stop-pct"
                type="text"
                inputMode="decimal"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-[#0B0F17] p-3">
              <div className="text-[11px] text-slate-400">Stop Win Dia</div>
              <div className="mt-1 font-mono text-base font-bold text-emerald-300">
                +R$ {stopWinValue.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B0F17] p-3">
              <div className="text-[11px] text-slate-400">Stop Loss Dia</div>
              <div className="mt-1 font-mono text-base font-bold text-red-300">
                -R$ {stopLossValue.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B0F17] p-3">
              <div className="text-[11px] text-slate-400">Projeção 30 Dias</div>
              <div className="mt-1 font-mono text-base font-bold text-slate-100">
                R$ {monthlyProjection.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Tabela de Metas Módulo 5 p.14 */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Tabela de Metas Fixas (Módulo 5 p.14)
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
              {[
                { dia: 'R$ 20/dia', mes: 'R$ 600/mês' },
                { dia: 'R$ 30/dia', mes: 'R$ 900/mês' },
                { dia: 'R$ 50/dia', mes: 'R$ 1.500/mês' },
              ].map((m) => (
                <div key={m.dia} className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                  <div className="font-semibold text-emerald-300">{m.dia}</div>
                  <div className="mt-1 text-slate-400">{m.mes}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculadora de 2 Mãos + Proteção 1.49x (Módulo 5 p.17) */}
        <section className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Estratégia de 2 Mãos com Proteção
              </h2>
              <p className="text-xs text-slate-400">Módulo 5 p.17 — Garanta a 1ª entrada antes de buscar o alvo</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModeEqual(false)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-medium cursor-pointer ${
                !modeEqual ? 'bg-[#1E293B] text-white' : 'bg-[#0B0F17] text-slate-400'
              }`}
            >
              1ª Mão Dobrada (Saída 1.49x)
            </button>
            <button
              type="button"
              onClick={() => setModeEqual(true)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-medium cursor-pointer ${
                modeEqual ? 'bg-[#1E293B] text-white' : 'bg-[#0B0F17] text-slate-400'
              }`}
            >
              Mãos Iguais (Saída 2.00x)
            </button>
          </div>

          <div>
            <label htmlFor="stake-2" className="block text-xs font-medium text-slate-300 mb-1.5">
              Valor da 2ª Mão (Alvo 5x / 10x) em R$
            </label>
            <input
              id="stake-2"
              type="text"
              inputMode="decimal"
              value={handTwoStake}
              onChange={(e) => setHandTwoStake(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl bg-[#0B0F17] p-3">
              <div className="text-slate-400">1ª Entrada (Proteção)</div>
              <div className="mt-1 font-mono text-base font-bold text-slate-100">
                R$ {handOneStake.toFixed(2)} em {handOneExit.toFixed(2)}x
              </div>
            </div>
            <div className="rounded-xl bg-[#0B0F17] p-3">
              <div className="text-slate-400">2ª Entrada (Alvo)</div>
              <div className="mt-1 font-mono text-base font-bold text-pink-300">
                R$ {baseStake.toFixed(2)} em 5x / 10x
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/10 text-xs rounded-xl bg-[#0B0F17] px-4 py-1">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-400">Se bater apenas a proteção ({handOneExit.toFixed(2)}x)</span>
              <span className={`font-mono font-semibold ${netIfOnlyHand1Hits >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {netIfOnlyHand1Hits >= 0 ? '+' : ''}R$ {netIfOnlyHand1Hits.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-400">Se a 2ª mão bater 5.00x</span>
              <span className="font-mono font-semibold text-emerald-300">+R$ {netIfHand2Hits5x.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-400">Se a 2ª mão bater 10.00x</span>
              <span className="font-mono font-semibold text-pink-300">+R$ {netIfHand2Hits10x.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-400">Risco máximo por entrada dupla</span>
              <span className="font-mono font-semibold text-red-300">-R$ {totalRiskIfLossBoth.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-slate-100">Recomendações Emocionais (Módulos 1 e 4)</div>
            <p>• Nunca cancele um saque da plataforma: se você não tira dinheiro dela, ela tira de você.</p>
            <p>• Em hipótese alguma opere em horários de recuperação após sequência de loss.</p>
            <p>• Na soma de +30 min (50x/100x), faça no máximo 3 acréscimos de +10 min.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
