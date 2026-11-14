import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-300 border ${
        isOnline
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
          : 'bg-rose-950/80 text-rose-300 border-rose-500/30 animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Modo Online Restaurado</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-rose-400" />
          <span>Modo Offline Ativo (PWA 100% Funcional)</span>
        </>
      )}
    </div>
  );
};
