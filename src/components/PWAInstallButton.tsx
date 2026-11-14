import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        App Instalado
      </span>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      await installApp();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white shadow-md shadow-fuchsia-600/25 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Instalar App no Celular ou Computador"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Instalar PWA</span>
      </button>

      {/* iOS / Manual Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-600 text-white shadow-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Instalar no seu Aparelho</h3>
                <p className="text-xs text-slate-400">Funciona offline e em tela cheia</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p className="text-xs text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                Para ter o Radar Aviator como um aplicativo nativo no seu iPhone ou Android:
              </p>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>
                    No Safari ou Chrome, toque no botão de <strong>Compartilhar</strong> (
                    <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-fuchsia-400" />) ou menu do navegador (⋮).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>
                    Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> (
                    <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-rose-400" />).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>
                    Toque em <strong>Adicionar</strong>. O ícone do app aparecerá na tela do seu celular!
                  </span>
                </li>
              </ol>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition text-center"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
