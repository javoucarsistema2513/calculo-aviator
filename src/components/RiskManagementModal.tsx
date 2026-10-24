import React, { useState } from 'react';
import { RiskProfile } from '../types/aviator';
import { ShieldCheck, Target, AlertTriangle, DollarSign, X, Check } from 'lucide-react';

interface RiskManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RiskProfile;
  onSaveProfile: (profile: RiskProfile) => void;
}

export const RiskManagementModal: React.FC<RiskManagementModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [bankroll, setBankroll] = useState<number>(profile.bankroll);
  const [dailyGoal, setDailyGoal] = useState<number>(profile.dailyGoal);
  const [baseBet, setBaseBet] = useState<number>(profile.baseBet);
  const [protectionMult, setProtectionMult] = useState<number>(profile.protectionMultiplier);
  const [maxGales, setMaxGales] = useState<number>(profile.maxGales);

  if (!isOpen) return null;

  const handleApplyPresetGoal = (goal: number) => {
    setDailyGoal(goal);
  };

  const handleSave = () => {
    onSaveProfile({
      bankroll,
      dailyGoal,
      baseBet,
      stopLoss: Math.round(bankroll * 0.2), // 20% stop loss
      stopWin: dailyGoal,
      protectionMultiplier: protectionMult,
      maxGales,
    });
    onClose();
  };

  // Calculations for double-hand strategy
  const hand1Bet = baseBet; // Protection hand
  const hand2Bet = Math.round(baseBet * 0.5 * 10) / 10; // Target hand
  const hand1Return = Math.round(hand1Bet * protectionMult * 100) / 100;
  const netCoverage = Math.round((hand1Return - hand1Bet - hand2Bet) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#131422] border border-gray-800 p-5 sm:p-6 shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Gestão de Banca & Mão Dupla (Pai do Aviator)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          
          {/* Tabela de Metas Presets (PDF Módulo 4 Página 15) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Tabela de Metas Diárias Oficiais:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPresetGoal(20)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  dailyGoal === 20
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <span className="font-extrabold text-sm block">R$ 20 / dia</span>
                <span className="text-[10px] text-gray-400 font-mono">R$ 600 / mês</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPresetGoal(30)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  dailyGoal === 30
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <span className="font-extrabold text-sm block">R$ 30 / dia</span>
                <span className="text-[10px] text-gray-400 font-mono">R$ 900 / mês</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPresetGoal(50)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  dailyGoal === 50
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <span className="font-extrabold text-sm block">R$ 50 / dia</span>
                <span className="text-[10px] text-gray-400 font-mono">R$ 1.500 / mês</span>
              </button>
            </div>
          </div>

          {/* Form Fields: Banca, Aposta Base, Multiplicador de Proteção */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Banca Total (R$):
              </label>
              <input
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm font-mono text-white outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Aposta Mão 1 (R$):
              </label>
              <input
                type="number"
                value={baseBet}
                onChange={(e) => setBaseBet(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm font-mono text-white outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Saque Proteção:
              </label>
              <select
                value={protectionMult}
                onChange={(e) => setProtectionMult(parseFloat(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm font-mono text-white outline-none focus:border-yellow-400"
              >
                <option value={1.49}>1.49x (Recomendado)</option>
                <option value={2.00}>2.00x (Dobrar)</option>
              </select>
            </div>
          </div>

          {/* Double-Hand Coverage Simulation */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-yellow-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between text-yellow-300 font-bold">
              <span>Estratégia de 2 Mãos Simultâneas:</span>
              <span className="font-mono text-[11px]">Proteção + Alvo</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-gray-300 text-[11px]">
              <div className="p-2 rounded-lg bg-gray-900">
                <span className="text-gray-400 block">Mão 1 (Proteção):</span>
                <span className="font-bold text-white font-mono">
                  R$ {hand1Bet.toFixed(2)} @ {protectionMult}x
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Retorna R$ {hand1Return.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-gray-900">
                <span className="text-gray-400 block">Mão 2 (Alvo Alto):</span>
                <span className="font-bold text-white font-mono">
                  R$ {hand2Bet.toFixed(2)} @ 10x ou mais
                </span>
                <span className="text-[10px] text-pink-400 block mt-0.5">
                  Lucro livre sem risco
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              *Mesmo se a 2ª mão tomar red, a 1ª mão com saída em {protectionMult}x cobre o investimento total da rodada.
            </p>
          </div>

          {/* Golden Rules of Emotion Management */}
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[11px] text-gray-300 space-y-1">
            <p className="font-bold text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Regras de Ouro do Módulo 1 & 4:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-400 pl-1">
              <li>Atingiu a meta diária? Saia imediatamente e volte apenas no dia seguinte.</li>
              <li>Nunca cancele um saque da plataforma ("se não tira dinheiro dela, ela tira de você").</li>
              <li>Nunca persiga loss após 2 gales consecutivos (G1 / G2).</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-950 font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Configuração</span>
          </button>
        </div>

      </div>
    </div>
  );
};
