import React from 'react';
import { Volume2, VolumeX, Bell, BellOff, Sparkles, Plane } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  isMuted: boolean;
  toggleMute: () => void;
  isPushGranted: boolean;
  requestPush: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSignalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted,
  toggleMute,
  isPushGranted,
  requestPush,
  activeTab,
  setActiveTab,
  activeSignalsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-950/50">
            <Plane className="w-5 h-5 text-white transform -rotate-45" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                AVIATOR <span className="text-rose-500">AI PRO</span>
              </h1>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Pai do Aviator
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Calculadora de Entradas & Visão Multimodal
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl border transition ${
              isMuted
                ? 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
            }`}
            title={isMuted ? 'Ativar avisos sonoros' : 'Silenciar áudio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Push notification toggle */}
          <button
            onClick={requestPush}
            className={`p-2 rounded-xl border transition ${
              isPushGranted
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
            }`}
            title={isPushGranted ? 'Notificações push ativas' : 'Ativar notificações push em tempo real'}
          >
            {isPushGranted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto scrollbar-none flex gap-1 border-t border-zinc-800/80 bg-zinc-950/60 py-1.5">
        {[
          { id: 'signals', label: 'Sinais & Radar', badge: activeSignalsCount > 0 ? activeSignalsCount : null },
          { id: 'screenshot', label: 'Leitor de Print (IA)', isNew: true },
          { id: 'calculators', label: 'Cálculos de Entradas' },
          { id: 'bankroll', label: 'Proteção 1.49x & Banca' },
          { id: 'mentor', label: 'Mentor IA ao Vivo' },
          { id: 'studies', label: 'Estudos dos PDFs' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-rose-600">
                  {tab.badge}
                </span>
              )}
              {tab.isNew && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  <Sparkles className="w-2.5 h-2.5" /> IA
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
