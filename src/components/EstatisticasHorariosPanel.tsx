import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Clock,
  Flame,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  AnalysisResult,
  RoundEntry,
  SearchLogItem,
  computeGameStatistics,
  getCurrentTimeStr,
  getOperatingScheduleSnapshot,
} from '../utils/aviatorEngine';

interface EstatisticasHorariosPanelProps {
  houseName: string;
  history: RoundEntry[];
  recentCandlesText: string;
  searchLog: SearchLogItem[];
  analysis: AnalysisResult;
  onScheduleAlert: (params: {
    key: string;
    title: string;
    body: string;
    houseName: string;
    roundNumber?: string;
    targetTime: string;
    targetMultiplier: string;
    protection: string;
  }) => Promise<void>;
}

function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${String(remM).padStart(2, '0')}m`;
  }
  return `${m}m ${String(remS).padStart(2, '0')}s`;
}

function formatMinutesWait(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
}

export const EstatisticasHorariosPanel: React.FC<EstatisticasHorariosPanelProps> = ({
  houseName,
  history,
  recentCandlesText,
  searchLog,
  analysis,
  onScheduleAlert,
}) => {
  const [nowTimeStr, setNowTimeStr] = useState<string>(() => getCurrentTimeStr());
  const [showFullHourMap, setShowFullHourMap] = useState(false);
  const [scheduledMinutes, setScheduledMinutes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTimeStr(getCurrentTimeStr());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const schedule = useMemo(() => getOperatingScheduleSnapshot(nowTimeStr), [nowTimeStr]);

  const stats = useMemo(
    () =>
      computeGameStatistics({
        houseName,
        history,
        recentCandlesText,
        searchLog,
      }),
    [houseName, history, recentCandlesText, searchLog]
  );

  const signalMinuteSet = useMemo(() => {
    const set = new Set<string>();
    for (const sig of analysis.signals) {
      const m = sig.targetTime.match(/\b(\d{2}):(\d{2})\b/);
      if (m && Number(m[1]) === schedule.currentHour) {
        set.add(m[2]);
      }
    }
    return set;
  }, [analysis.signals, schedule.currentHour]);

  return (
    <section
      id="horarios-estatisticas"
      className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6 space-y-6"
    >
      {/* Header + Live Clock Status */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-semibold text-slate-100">
              Melhores Horários, Minutos Fortes & Estatística do Jogo
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Leitura em tempo real dos ciclos do Módulo 4 p.50, minutos terminados em <span className="font-mono text-amber-300">0 / 5 / 9</span> e métricas reais da mesa <strong className="text-slate-200">{houseName}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
              {schedule.nowTimeStr}
            </span>
          </div>
          <span className="text-slate-600" aria-hidden="true">|</span>
          {schedule.activeWindow ? (
            <span className="text-xs font-semibold text-emerald-300">
              HORÁRIO PICO ATIVO ({schedule.activeWindow.label} · restam {schedule.activeWindow.minutesRemaining}m)
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-300">
              Fora do pico · próximo em <strong className="font-mono tabular-nums">{formatMinutesWait(schedule.nextWindow.minutesUntilStart ?? 0)}</strong> ({schedule.nextWindow.start})
            </span>
          )}
        </div>
      </div>

      {/* Section 1 & 2: Melhores Horários + Minutos Fortes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Melhores Horários de Operação */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Melhores Horários de Operação (Mód. 4 p.50)</span>
            </h3>
            <span className="text-[11px] text-slate-400">5 janelas oficiais</span>
          </div>

          <div className="space-y-2">
            {schedule.windows.map((win) => {
              const isActive = win.status === 'ativo';
              const isNext = win.status === 'proximo';
              return (
                <div
                  key={win.label}
                  className={`rounded-xl border p-3 transition-colors ${
                    isActive
                      ? 'border-emerald-400/60 bg-emerald-500/12'
                      : isNext
                        ? 'border-amber-400/45 bg-amber-500/10'
                        : 'border-white/10 bg-[#0B0F17]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono text-sm font-bold tabular-nums ${
                          isActive ? 'text-emerald-300' : isNext ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        {win.label}
                      </span>
                      <span className="text-xs font-medium text-slate-300">{win.periodName}</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold uppercase tabular-nums ${
                        isActive ? 'text-emerald-300' : isNext ? 'text-amber-300' : 'text-slate-500'
                      }`}
                    >
                      {isActive
                        ? `ATIVO · ${win.minutesRemaining}m`
                        : isNext
                          ? `PRÓXIMO EM ${formatMinutesWait(win.minutesUntilStart ?? 0)}`
                          : `em ${formatMinutesWait(win.minutesUntilStart ?? 0)}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{win.strategyNote}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minutos Fortes em Tempo Real */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Próximos Minutos Fortes (Finais 0 · 5 · 9)</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowFullHourMap((v) => !v)}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              {showFullHourMap ? 'Ocultar grade da hora' : `Ver hora ${String(schedule.currentHour).padStart(2, '0')}h completa`}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {schedule.upcomingStrongMinutes.map((item) => {
              const isGold = item.tier === 'ouro';
              const minKey = `strongmin:${item.targetTime}`;
              const isScheduled = scheduledMinutes[minKey];
              return (
                <div
                  key={item.targetTime}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                    isGold
                      ? 'border-pink-400/50 bg-pink-500/10'
                      : 'border-violet-400/40 bg-violet-500/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                        {item.minuteLabel}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold uppercase ${
                          isGold ? 'text-pink-300' : 'text-violet-300'
                        }`}
                      >
                        {isGold ? 'OURO (00/05/09)' : 'MIN FORTE'}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-300 tabular-nums">
                      em {formatCountdown(item.secondsUntil)}
                      {item.isInsideBestHour && (
                        <span className="ml-1.5 text-emerald-300">· Pico</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await onScheduleAlert({
                        key: minKey,
                        title: `${houseName} · Minuto Forte ${item.minuteLabel}`,
                        body: `${isGold ? 'Minuto Ouro (00/05/09)' : 'Minuto Forte (final 0/5/9)'} às ${item.targetTime}. Observe quebra ou entre 15–30s antes com proteção em 1.49x.`,
                        houseName,
                        targetTime: item.targetTime,
                        targetMultiplier: isGold ? '5x / 10x (Rosa)' : '2x–5x (Roxo)',
                        protection: '1.49x',
                      });
                      setScheduledMinutes((prev) => ({ ...prev, [minKey]: true }));
                    }}
                    className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      isScheduled
                        ? 'border-emerald-500/45 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/15 bg-[#0B0F17] text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Bell className="h-3 w-3" />
                    <span>{isScheduled ? 'Agendado' : 'Alertar'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {showFullHourMap && (
            <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px]">
                <span className="font-semibold text-slate-200">
                  Mapa de Minutos — {String(schedule.currentHour).padStart(2, '0')}h00 até {String(schedule.currentHour).padStart(2, '0')}h59
                </span>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="text-pink-300 font-semibold">Ouro (00/05/09)</span>
                  <span className="text-violet-300 font-semibold">Forte (0/5/9)</span>
                  <span className="text-emerald-300 font-semibold">Sinal Buscador</span>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {schedule.hourMinuteMap.map((m) => {
                  const hasBuscadorSignal = signalMinuteSet.has(m.label);
                  const cls = m.isCurrent
                    ? 'border-emerald-400 bg-emerald-500/30 text-white font-bold ring-1 ring-emerald-300'
                    : hasBuscadorSignal
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                      : m.tier === 'ouro'
                        ? 'border-pink-400/60 bg-pink-500/20 text-pink-200 font-bold'
                        : m.tier === 'forte'
                          ? 'border-violet-400/45 bg-violet-500/15 text-violet-200 font-semibold'
                          : 'border-white/10 bg-[#131A26] text-slate-500';
                  return (
                    <div
                      key={m.minute}
                      title={`:${m.label}${m.isCurrent ? ' (Minuto Atual)' : ''}${hasBuscadorSignal ? ' · Sinal Ativo' : ''}`}
                      className={`rounded border py-1 text-center font-mono text-[11px] tabular-nums ${cls}`}
                    >
                      :{m.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Estatística do Jogo */}
      <div className="border-t border-white/10 pt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Estatística do Jogo — {houseName}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {stats.sampleCount > 0 ? stats.sourceLabel : 'Sem amostras na mesa ainda (cole velas ou registre rodadas)'}
          </span>
        </div>

        {/* Proportion Bar & Core KPIs */}
        {stats.sampleCount > 0 ? (
          <>
            <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                <span className="font-semibold text-slate-200">
                  Distribuição das {stats.sampleCount} Velas Analisadas
                </span>
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                  <span className="text-sky-300">Azuis (&lt;2x): {stats.azulPct}% ({stats.azulCount})</span>
                  <span className="text-violet-300">Roxas (2x–9.99x): {stats.roxoPct}% ({stats.roxoCount})</span>
                  <span className="text-pink-300">Rosas (10x+): {stats.rosaPct}% ({stats.rosaCount})</span>
                </div>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
                {stats.azulPct > 0 && (
                  <div className="bg-sky-500 transition-all" style={{ width: `${stats.azulPct}%` }} />
                )}
                {stats.roxoPct > 0 && (
                  <div className="bg-violet-500 transition-all" style={{ width: `${stats.roxoPct}%` }} />
                )}
                {stats.rosaPct > 0 && (
                  <div className="bg-pink-500 transition-all" style={{ width: `${stats.rosaPct}%` }} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-400">Taxa Pagante (≥ 2x)</div>
                <div
                  className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                    stats.payRatePct >= 50 ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {stats.payRatePct}%
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats.payRatePct >= 50 ? 'Gráfico Pague' : 'Gráfico Recolhe'}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-400">Média das Roxas</div>
                <div
                  className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                    stats.roxoAvg >= 2.6 ? 'text-violet-300' : 'text-amber-300'
                  }`}
                >
                  {stats.roxoAvg > 0 ? `${stats.roxoAvg.toFixed(2)}x` : '—'}
                </div>
                <div className="text-[11px] text-slate-500">Meta Mód. 2: ≥ 2.60x</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-400">Maior Vela</div>
                <div className="mt-1 font-mono text-lg font-bold text-pink-300 tabular-nums">
                  {stats.maxMultiplier.toFixed(2)}x
                </div>
                <div className="text-[11px] text-slate-500">
                  Média geral: {stats.avgMultiplier.toFixed(2)}x
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-400">Seca de Rosa (10x+)</div>
                <div className="mt-1 font-mono text-lg font-bold text-amber-300 tabular-nums">
                  {stats.roundsSinceLastRosa === 0
                    ? 'Acabou de sair'
                    : `${stats.roundsSinceLastRosa} rod.`}
                </div>
                <div className="text-[11px] text-slate-500">Desde a última ≥ 10x</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-400">Cadência da Casa</div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-100 tabular-nums">
                  {analysis.pace.secondsPerRound}s
                </div>
                <div className="text-[11px] text-slate-500">
                  ~{analysis.pace.roundsPerMinute} rodadas/min
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3">
                <div className="text-[11px] text-slate-400">Assertividade Log</div>
                <div className="mt-1 font-mono text-lg font-bold text-emerald-300 tabular-nums">
                  {stats.logStats.green + stats.logStats.loss > 0
                    ? `${stats.logStats.winRatePct}%`
                    : '—'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats.logStats.green}G · {stats.logStats.loss}L ({stats.logStats.total} salvas)
                </div>
              </div>
            </div>

            {/* Decimals & Hourly Stats */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3.5">
                <div className="text-xs font-semibold text-slate-200 mb-2">
                  Decimais Mais Frequentes (Treinamento III p.10)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {stats.topDecimals.map((d) => (
                    <div key={d.digit} className="rounded-lg border border-white/10 bg-[#131A26] p-2 text-center">
                      <div className="font-mono text-sm font-bold text-amber-300">.x{d.digit}</div>
                      <div className="font-mono text-[11px] text-slate-300 tabular-nums">
                        {d.count}x ({d.pct}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3.5">
                <div className="text-xs font-semibold text-slate-200 mb-2">
                  Desempenho por Hora no Seu Histórico
                </div>
                {stats.hourlyBreakdown.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {stats.hourlyBreakdown.map((h) => (
                      <div key={h.hourLabel} className="rounded-lg border border-white/10 bg-[#131A26] p-2 text-center">
                        <div className="font-mono text-xs font-bold text-slate-100">{h.hourLabel}</div>
                        <div
                          className={`font-mono text-xs font-bold tabular-nums ${
                            h.payRatePct >= 50 ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {h.payRatePct}%
                        </div>
                        <div className="text-[10px] text-slate-500">{h.total} rod.</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    Registre rodadas com horário no histórico para ranquear automaticamente suas horas mais pagantes.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4 text-xs text-slate-300">
            Cole as últimas velas da mesa no campo <strong>Últimas Velas da Mesa</strong> acima ou clique em <strong>Registrar no Histórico</strong> para liberar o cálculo ao vivo de % Azul/Roxo/Rosa, média das roxas, seca de rosa e decimais predominantes de <strong>{houseName}</strong>.
          </div>
        )}

        {/* Official Method Statistical Benchmarks */}
        <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Estatísticas Oficiais de Referência dos Módulos (PDF)</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-lg bg-[#131A26] p-2.5">
              <div className="font-mono font-bold text-emerald-300">80% Roxo Final 1</div>
              <div className="mt-0.5 text-slate-400">Vela roxa terminada em .x1 puxa 2x+ na sequência (Mód. 4 p.53).</div>
            </div>
            <div className="rounded-lg bg-[#131A26] p-2.5">
              <div className="font-mono font-bold text-red-300">80% Roxo Final 7</div>
              <div className="mt-0.5 text-slate-400">Vela roxa terminada em .x7 tende a puxar REDS/azuis (Mód. 4 p.53).</div>
            </div>
            <div className="rounded-lg bg-[#131A26] p-2.5">
              <div className="font-mono font-bold text-pink-300">95% Regra dos 13</div>
              <div className="mt-0.5 text-slate-400">Após vela ≥ 30x, retorno de alta sai nas casas ímpares até +13 (Mód. 4 p.48).</div>
            </div>
            <div className="rounded-lg bg-[#131A26] p-2.5">
              <div className="font-mono font-bold text-violet-300">Média Roxo ≥ 2.60x</div>
              <div className="mt-0.5 text-slate-400">Indica gráfico em Pague contínuo; ≤ 2.15x sinaliza recolhe (Mód. 2 p.8).</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
