import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, show a subtle active badge
  if (isInstalled) {
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        PWA Instalado
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-3.5 py-2 text-xs md:text-sm font-bold text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition active:scale-95 cursor-pointer"
        title="Instalar aplicativo na tela inicial"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-white text-sm">
                    A
                  </div>
                  <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-zinc-300">
                <div className="flex items-start gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white">1. Toque em Compartilhar</strong>
                    <p className="text-xs text-zinc-400 mt-0.5">Localizado na barra inferior do navegador Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white">2. Adicionar à Tela de Início</strong>
                    <p className="text-xs text-zinc-400 mt-0.5">Role para baixo nas opções e toque em "Adicionar à Tela de Início".</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 text-center pt-2">
                  O Aviator AI Pro funcionará como um app nativo em tela cheia com acesso rápido!
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-sm font-semibold text-white transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button if user is on desktop browser without beforeinstallprompt fired yet
  return (
    <button
      onClick={() => {
        alert('Para instalar este app:\n1. Clique no ícone de instalar na barra de endereços do seu navegador Chrome/Edge\nou\n2. No menu do navegador (3 pontinhos) > "Instalar Aviator AI Pro".');
      }}
      className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition"
      title="Instalar aplicativo PWA"
    >
      <Download className="w-3.5 h-3.5 text-rose-400" />
      <span>Instalar PWA</span>
    </button>
  );
};
