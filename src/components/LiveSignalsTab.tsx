import React, { useEffect, useState } from 'react';
import { PatternSignal, CycleStatus, AviatorCandle } from '../services/aviatorEngine';
import { Zap, ShieldCheck, AlertTriangle, Flame, Bell, CheckCircle2, Play, Pause, Sparkles } from 'lucide-react';

interface LiveSignalsTabProps {
  signals: PatternSignal[];
  cycle: CycleStatus;
  candles: AviatorCandle[];
  onPlaySignal: () => void;
  onPlayPink: () => void;
  onPlayDanger: () => void;
  sendPush: (title: string, body: string, isCritical?: boolean) => void;
  onAddCandle: (value: number) => void;
}

export const LiveSignalsTab: React.FC<LiveSignalsTabProps> = ({
  signals,
  cycle,
  candles,
  onPlaySignal,
  onPlayPink,
  onPlayDanger,
  sendPush,
  onAddCandle,
}) => {
  const [lastSignalId, setLastSignalId] = useState<string | null>(null);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [secondsUntilNextRound, setSecondsUntilNextRound] = useState(15);

  // Trigger alerts when a new high-priority signal appears
  useEffect(() => {
    if (signals.length > 0) {
      const topSignal = signals[0];
      if (topSignal.id !== lastSignalId) {
        setLastSignalId(topSignal.id);

        if (topSignal.targetMultiplier.includes('Rosa')) {
          onPlayPink();
        } else if (topSignal.level === 'CRITICAL_ALERT') {
          onPlaySignal();
        }

        sendPush(
          `SINAL AVIATOR: ${topSignal.title}`,
          `${topSignal.description} | Alvo: ${topSignal.targetMultiplier} (${topSignal.assertiveness}% assertivo)`,
          topSignal.level === 'CRITICAL_ALERT'
        );
      }
    }
  }, [signals, lastSignalId, onPlaySignal, onPlayPink, sendPush]);

  // Alert on dangerous cycle
  useEffect(() => {
    if (cycle.type === 'RECOLHE') {
      onPlayDanger();
    }
  }, [cycle.type, onPlayDanger]);

  // Round Simulator (1 round every 8 seconds) for testing & live preview
  useEffect(() => {
    if (!isSimulatorRunning) return;

    const timer = setInterval(() => {
      setSecondsUntilNextRound((prev) => {
        if (prev <= 1) {
          // Generate a realistic round following Aviator probability distribution
          const r = Math.random();
          let generatedVal = 1.0;
          if (r < 0.55) {
            // Blue (< 2.00x)
            generatedVal = Math.round((1.00 + Math.random() * 0.99) * 100) / 100;
          } else if (r < 0.88) {
            // Purple (2.00x - 9.99x)
            generatedVal = Math.round((2.00 + Math.random() * 7.99) * 100) / 100;
          } else {
            // Pink (10.00x+)
            generatedVal = Math.round((10.00 + Math.random() * 45.00) * 100) / 100;
          }

          onAddCandle(generatedVal);
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulatorRunning, onAddCandle]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Simulator toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Radar de Entradas em Tempo Real
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitoramento contínuo das velas segundo os 6 módulos do Pai do Aviator.
          </p>
        </div>

        {/* Live Simulator button */}
        <div className="flex items-center gap-3">
          {isSimulatorRunning && (
            <span className="text-xs font-mono text-zinc-400">
              Próxima rodada em <strong className="text-rose-400 font-bold">{secondsUntilNextRound}s</strong>
            </span>
          )}
          <button
            onClick={() => setIsSimulatorRunning(!isSimulatorRunning)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isSimulatorRunning
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
            }`}
          >
            {isSimulatorRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pausar Simulador
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" /> Iniciar Simulador ao Vivo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recolhe Warning if Platform is Retaining */}
      {cycle.type === 'RECOLHE' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 flex items-start gap-3 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <strong className="block text-sm font-black text-rose-300">
              PLATAFORMA EM CICLO DE RECOLHE (ALTO RISCO DE LOSS)
            </strong>
            <p className="text-rose-200/90">
              O gráfico está com {cycle.bluePercent}% de velas azuis. A regra de ouro da mentoria diz:
              <strong> "Quem comanda o game é o azul. Nunca opere em horários de recuperação ou com gráfico predominantemente azul."</strong>
            </p>
            <p className="text-xs text-rose-300/80 pt-1">
              Aguarde a plataforma pagar uma vela roxa ou rosa para quebrar a retenção antes de voltar a entrar.
            </p>
          </div>
        </div>
      )}

      {/* Signals List */}
      {signals.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum gatilho ativo no momento</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Adicione mais velas no histórico acima ou envie um print para calibrar a leitura de padrões (Reset 1.00x, 1.37x, Casa 90, 4 Roxos, etc.).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>{signals.length} Sinais Assertivos Detectados no Gráfico</span>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Proteção 1.49x Recomendada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((sig) => {
              const isPinkTarget = sig.targetMultiplier.includes('Rosa');
              return (
                <div
                  key={sig.id}
                  className={`relative p-5 rounded-3xl border transition shadow-xl space-y-3.5 ${
                    isPinkTarget
                      ? 'bg-gradient-to-br from-fuchsia-950/40 via-zinc-900 to-zinc-950 border-fuchsia-700/60 shadow-fuchsia-950/30'
                      : sig.level === 'CRITICAL_ALERT'
                      ? 'bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-950 border-rose-700/60 shadow-rose-950/30'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {sig.strategyName}
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5 leading-snug">
                        {sig.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                          sig.assertiveness >= 95
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {sig.assertiveness}% Assertivo
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {sig.description}
                  </p>

                  {/* Targets & Action */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Alvo do Multiplicador:</span>
                      <span className="font-mono font-black text-sm text-rose-400">
                        {sig.targetMultiplier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Recomendação de Entrada:</span>
                      <span className="font-bold text-white text-right">
                        {sig.actionRecommendation}
                      </span>
                    </div>

                    {sig.upcomingTargetHouses && sig.upcomingTargetHouses.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Casas Alvo pós-gatilho:</span>
                        <div className="flex gap-1">
                          {sig.upcomingTargetHouses.map((h) => (
                            <span
                              key={h}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[11px] font-bold"
                            >
                              {h}ª
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Protection advice */}
                  <div className="flex items-start gap-2 text-[11px] text-emerald-400 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-800/30">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{sig.protectionAdvice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
