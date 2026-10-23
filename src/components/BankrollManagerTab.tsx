import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Target, TrendingUp, Heart, CheckCircle2, AlertOctagon } from 'lucide-react';

export const BankrollManagerTab: React.FC = () => {
  const [bankroll, setBankroll] = useState('200.00');
  const [dailyMeta, setDailyMeta] = useState<'20' | '30' | '50' | 'custom'>('30');
  const [customMeta, setCustomMeta] = useState('30.00');
  const [stopLossPercent, setStopLossPercent] = useState('15');

  const bankrollNum = parseFloat(bankroll) || 200;
  const targetDailyValue = dailyMeta === 'custom' ? parseFloat(customMeta) || 30 : parseFloat(dailyMeta);
  const monthlyProjection = targetDailyValue * 30;

  const conservativeStake = Math.max(1, Math.round((bankrollNum * 0.015) * 100) / 100); // 1.5% da banca
  const moderateStake = Math.max(1, Math.round((bankrollNum * 0.03) * 100) / 100); // 3% da banca
  const stopLossValue = Math.round((bankrollNum * (parseFloat(stopLossPercent) / 100)) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <DollarSign className="w-3.5 h-3.5" /> Módulo I, IV & V • Gestão de Banca
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gerenciamento de Capital & Metas Diárias
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            "O maior erro no Aviator é NÃO fazer gestão de banca ou não aceitar um loss. O seu capital é a sua empresa: jamais quebre-a!"
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              Sua Banca Atual (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 font-mono text-sm">R$</span>
              <input
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              Tabela de Metas do Curso
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['20', '30', '50'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDailyMeta(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    dailyMeta === m
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  R$ {m}/dia
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              Limite de Stop Loss Diário (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-rose-500"
              />
              <span className="absolute right-4 top-2.5 text-zinc-400 font-mono text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Calculated metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Daily & Monthly Target */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" /> Meta de Lucro Diária
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              R$ {targetDailyValue.toFixed(2)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Projeção 30 dias: <strong className="text-white">R$ {monthlyProjection.toFixed(2)}</strong> no mês!
            </p>
          </div>

          {/* Recommended bet size */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Aposta Segura por Entrada
            </span>
            <div className="text-2xl font-black font-mono text-blue-400">
              R$ {conservativeStake.toFixed(2)} a R$ {moderateStake.toFixed(2)}
            </div>
            <p className="text-[11px] text-zinc-400">
              1.5% a 3% do capital para suportar variações sem risco de quebra.
            </p>
          </div>

          {/* Stop Loss limit */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" /> Stop Loss Máximo no Dia
            </span>
            <div className="text-2xl font-black font-mono text-rose-400">
              -R$ {stopLossValue.toFixed(2)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Atingiu esse valor? PARE imediatamente e retorne no dia seguinte!
            </p>
          </div>
        </div>

        {/* The 3 Course Target Banners (As seen on Módulo V pág. 14) */}
        <div className="pt-2">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-3">
            TABELA OFICIAL DE METAS DO PAI DO AVIATOR:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <div className="text-lg font-black text-white">👍 20,00 POR DIA</div>
              <div className="text-sm font-bold text-emerald-400">600,00 NO MÊS</div>
              <div className="text-[10px] text-zinc-500">Ideal para bancas a partir de R$ 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-800/40 text-center space-y-1">
              <div className="text-lg font-black text-white">👍 30,00 POR DIA</div>
              <div className="text-sm font-bold text-emerald-400">900,00 NO MÊS</div>
              <div className="text-[10px] text-zinc-500">Ideal para bancas a partir de R$ 200</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <div className="text-lg font-black text-white">👍 50,00 POR DIA</div>
              <div className="text-sm font-bold text-emerald-400">1.500,00 NO MÊS</div>
              <div className="text-[10px] text-zinc-500">Ideal para bancas a partir de R$ 400</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Emotional Rules */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" /> Os 7 Mandamentos do Gerenciamento Emocional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">1. Aprenda a Parar</strong>
              Faça o seu lucro diário estipulado, solicite o saque e só retorne no dia seguinte ou em outro ciclo limpo.
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">2. Seu Capital é Sua Empresa</strong>
              Trate sua banca com respeito empresarial rigoroso. Quem não preserva o capital é engolido pela plataforma.
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">3. Nunca Cancele um Saque</strong>
              Se você não tira o dinheiro da plataforma, a plataforma tira de você. Realize saques constantes.
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">4. Jamais Jogue em Horários de Recuperação</strong>
              Não tente "recuperar" perdas com desespero aumentando valores fora da estratégia. Isso é a fórmula da quebra.
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">5. Pense como Porcentagem</strong>
              Um ganho diário de 5% a 10% da banca é uma multiplicação monstruosa no fim do mês. Não seja ganancioso.
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">6. Máximo 1 ou 2 Gales (G1 / G2)</strong>
              Operações de mão fixa ou no máximo G1/G2. Insistir infinitamente destrói qualquer gerenciamento.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
