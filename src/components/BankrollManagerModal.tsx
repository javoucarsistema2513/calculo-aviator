import React, { useState } from 'react';
import { X, ShieldCheck, DollarSign, Calculator, AlertOctagon, TrendingUp } from 'lucide-react';

interface BankrollManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankrollManagerModal: React.FC<BankrollManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [bankroll, setBankroll] = useState<number>(100);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(10);

  if (!isOpen) return null;

  // Dual bet calculation according to Módulo 1 & 5
  // Bet 1: Protection at 1.50x (Recovers both bets)
  // Bet 2: Free profit at target multiplier (10x, 50x, 100x)
  // Formula: Bet 1 = 2 * Bet 2. When Bet 1 cashes out at 1.50x, Return = 2 * 1.5 = 3x of Bet 2, which covers 2 + 1 = 3! Zero risk for Bet 2!
  const betBase = Math.max(1, Math.floor((bankroll * 0.02) / 3)); // 2% total bankroll max risk
  const bet2 = betBase;
  const bet1 = betBase * 2;
  const totalBet = bet1 + bet2;
  const protectionReturn = bet1 * 1.5;
  const profitAtTarget = bet2 * targetMultiplier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Gestão de Banca & Proteção 1.49x
              </h2>
              <p className="text-xs text-slate-400">
                Regra de Ouro do Módulo 1 e 5: Proteção de Capital
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Daily Goals from PDF */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Tabela de Metas Diárias (PDF Módulo 1)
            </h3>
            <p className="text-slate-400 mb-3 text-[11px]">
              O segredo para viver do mercado é bater a meta e sair. Nunca tente dobrar a banca em um dia.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Banca R$ 50</span>
                <span className="text-base font-black text-emerald-400">Meta: R$ 20</span>
                <span className="text-[10px] text-slate-500 block">40% / dia</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Banca R$ 100</span>
                <span className="text-base font-black text-emerald-400">Meta: R$ 30</span>
                <span className="text-[10px] text-slate-500 block">30% / dia</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Banca R$ 200+</span>
                <span className="text-base font-black text-emerald-400">Meta: R$ 50</span>
                <span className="text-[10px] text-slate-500 block">25% / dia</span>
              </div>
            </div>
          </div>

          {/* Dual-Hand Calculator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-pink-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              Calculadora de 2 Entradas Simultâneas
            </h3>
            <p className="text-slate-400 text-[11px]">
              A mão 1 fecha em <strong>1.50x</strong> e paga o valor das duas apostas. A mão 2 busca a vela Rosa ou 100x com <strong>Risco ZERO</strong>!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sua Banca Total (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    value={bankroll}
                    onChange={(e) => setBankroll(Math.max(10, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Alvo Mão 2 (Multiplicador)</label>
                <select
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-pink-500"
                >
                  <option value={5}>5.00x (Roxa Segura)</option>
                  <option value={10}>10.00x (Rosa Padrão)</option>
                  <option value={20}>20.00x (Rosa Alta)</option>
                  <option value={50}>50.00x (Super Alta)</option>
                  <option value={100}>100.00x (Vela Épica)</option>
                </select>
              </div>
            </div>

            {/* Calculated Bets Display */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                  1ª Entrada (Proteção 1.50x)
                </span>
                <div className="text-lg font-black text-emerald-300">R$ {bet1.toFixed(2)}</div>
                <span className="text-[10px] text-slate-400">
                  Retorna R$ {protectionReturn.toFixed(2)} ao bater 1.50x
                </span>
              </div>

              <div className="p-3 rounded-lg bg-pink-950/40 border border-pink-500/30">
                <span className="text-[10px] uppercase font-bold text-pink-400 block mb-0.5">
                  2ª Entrada (Busca {targetMultiplier}x)
                </span>
                <div className="text-lg font-black text-pink-300">R$ {bet2.toFixed(2)}</div>
                <span className="text-[10px] text-slate-400">
                  Lucro limpo: +R$ {profitAtTarget.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Investimento por rodada: <strong>R$ {totalBet.toFixed(2)}</strong></span>
              <span className="text-emerald-400 font-semibold">Totalmente coberto ao bater 1.50x</span>
            </div>
          </div>

          {/* Stop Loss & Disciplina */}
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-300">Regra de Stop Loss Estrito</h4>
              <p className="text-[11px] text-slate-300">
                Se tiver 3 tentativas consecutivas sem pagar na janela prevista, pare imediatamente. O algoritmo pode estar em ciclo de retenção (mercado frio). Volte no próximo horário forte.
              </p>
            </div>
          </div>
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
