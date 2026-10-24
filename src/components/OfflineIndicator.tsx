import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>100% Offline Ready</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-gray-950 shadow-xl border border-amber-300 animate-pulse">
      <WifiOff className="w-4 h-4 text-gray-950" />
      <span>Modo Offline Ativo — Calculadora operando localmente</span>
    </div>
  );
};
