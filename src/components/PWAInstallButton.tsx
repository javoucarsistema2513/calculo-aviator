import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Instalar App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#131A26] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="pwa-install-title" className="text-lg font-semibold text-slate-100">
                  Instalar Aviator Radar Pro
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Funciona offline e direto da tela inicial como aplicativo nativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-100 cursor-pointer"
                aria-label="Fechar instruções"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p>1. Toque no botão <strong className="text-white inline-flex items-center gap-1"><Share className="h-3.5 w-3.5 inline" /> Compartilhar</strong> na barra do Safari.</p>
                <p>2. Role para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong>.</p>
                <p>3. Confirme tocando em <strong className="text-white">Adicionar</strong>.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p>1. Abra o menu do navegador (três pontos no canto superior).</p>
                <p>2. Selecione <strong className="text-white">Instalar aplicativo</strong> ou <strong className="text-white">Adicionar à tela inicial</strong>.</p>
                <p>3. Todos os cálculos, gatilhos e históricos ficam disponíveis offline.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[44px] rounded-xl bg-white/10 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/15 transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
