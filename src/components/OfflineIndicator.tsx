import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/90 px-3 py-2 text-xs font-medium text-amber-200 shadow-lg backdrop-blur-md">
      <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
      <span>Modo Offline — Cálculos e dados locais ativos</span>
    </div>
  );
};
