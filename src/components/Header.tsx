import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { BETTING_HOUSES } from '../utils/aviatorCalculations';
import { Plane, Volume2, VolumeX, ShieldAlert, Clock, Sparkles } from 'lucide-react';

interface HeaderProps {
  selectedHouse: string;
  onSelectHouse: (houseId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRiskModal: () => void;
  onLoadExample: (exampleIndex: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedHouse,
  onSelectHouse,
  soundEnabled,
  onToggleSound,
  onOpenRiskModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0d0e17]/90 backdrop-blur-md border-b border-gray-800/80 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-600 shadow-lg shadow-pink-600/30 border border-pink-400/40">
              <Plane className="w-5 h-5 text-white transform -rotate-45 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0e17]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white">
                  AVIATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">PREDICTOR PRO</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  <Sparkles className="w-2.5 h-2.5 text-pink-400" /> V5 ALGO
                </span>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>Calculadora Estatística & Algoritmo de Probabilidades</span>
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Icons */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-lg border text-xs transition ${
                soundEnabled
                  ? 'border-pink-500/40 bg-pink-950/40 text-pink-300'
                  : 'border-gray-800 bg-gray-900/60 text-gray-500'
              }`}
              title={soundEnabled ? 'Sons ativados' : 'Sons mudos'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <PWAInstallButton />
          </div>
        </div>

        {/* Right: Controls, House Selector, Clock, Risk Modal button */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 text-xs">
          
          {/* House Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900/80 border border-gray-800 rounded-xl px-2.5 py-1.5">
            <span className="text-gray-400 text-[11px] font-medium hidden sm:inline">Plataforma:</span>
            <select
              value={selectedHouse}
              onChange={(e) => onSelectHouse(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
            >
              {BETTING_HOUSES.map((house) => (
                <option key={house.id} value={house.id} className="bg-[#141522] text-white">
                  {house.name} {house.isPopular ? '⭐' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Live Clock with Second Hand */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900/70 border border-gray-800 text-gray-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '60s' }} />
            <span className="font-bold text-white tracking-widest">{currentTime || '--:--:--'}</span>
          </div>

          {/* Risk Management Button */}
          <button
            onClick={onOpenRiskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-500/30 bg-yellow-950/20 text-yellow-300 hover:bg-yellow-900/30 transition font-medium cursor-pointer"
            title="Gerenciamento de Banca, Mão 1.49x e Stop Win/Loss"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Gestão & Proteção</span>
            <span className="sm:hidden">Gestão</span>
          </button>

          {/* Desktop Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`hidden md:flex items-center gap-1.5 p-2 rounded-xl border text-xs transition cursor-pointer ${
              soundEnabled
                ? 'border-pink-500/40 bg-pink-950/40 text-pink-300'
                : 'border-gray-800 bg-gray-900/60 text-gray-500'
            }`}
            title={soundEnabled ? 'Sons ativados' : 'Sons mudos'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Desktop PWA Install Button */}
          <div className="hidden md:block">
            <PWAInstallButton />
          </div>

          <OfflineIndicator />
        </div>

      </div>
    </header>
  );
};
