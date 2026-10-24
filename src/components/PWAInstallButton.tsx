import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running in standalone mode, show subtle installed badge or null
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-pink-600/20 border border-pink-400/30 transition-all duration-200 active:scale-95 cursor-pointer"
        title="Instalar como aplicativo no celular ou computador (Funciona 100% Offline)"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Instalar App PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-950/40 px-3 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-900/50 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#141522] border border-pink-500/30 p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-pink-400" />
                  Instalar no iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-xs font-bold text-pink-400">
                    1
                  </span>
                  <p>
                    No Safari, toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-xs font-bold text-pink-400">
                    2
                  </span>
                  <p>
                    Role o menu para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-xs font-bold text-pink-400">
                    3
                  </span>
                  <p>
                    Confirme em <strong>Adicionar</strong> no canto superior direito para usar offline a qualquer hora!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback always visible button if browser hasn't fired beforeinstallprompt yet
  return (
    <button
      onClick={() => {
        alert('Para instalar no seu navegador, clique nos 3 pontinhos do menu e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
      }}
      className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/70 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
      title="Instalar PWA no dispositivo"
    >
      <Download className="w-3.5 h-3.5 text-pink-400" />
      <span>Instalar App</span>
    </button>
  );
};
