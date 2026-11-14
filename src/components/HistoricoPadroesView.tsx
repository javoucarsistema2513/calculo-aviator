import React, { useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FileUp,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  AnalysisResult,
  RoundEntry,
  SearchLogItem,
  addSecondsToTime,
  getCurrentTimeStr,
  parseMultiplier,
} from '../utils/aviatorEngine';

interface HistoricoPadroesViewProps {
  selectedHouse: string;
  history: RoundEntry[];
  searchLog: SearchLogItem[];
  analysis: AnalysisResult;
  onBatchAdd: (entries: RoundEntry[]) => void;
  onRemoveEntry: (id: string) => void;
  onClearHouseHistory: () => void;
  onSelectEntryForSearch: (entry: RoundEntry) => void;
  onUpdateLogResult: (id: string, result: 'green' | 'loss' | 'pending') => void;
  onDeleteLogItem: (id: string) => void;
}

function parseHistoryContent(
  rawText: string,
  houseName: string,
  baseRound: number,
  newestFirst: boolean
): RoundEntry[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Try JSON import first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { history?: unknown[] }).history)
          ? (parsed as { history: unknown[] }).history
          : [];

      const now = Date.now();
      const entries: RoundEntry[] = [];
      list.forEach((item, idx) => {
        if (typeof item === 'number') {
          if (item >= 1) {
            entries.push({
              id: `${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              roundNumber: baseRound + idx,
              multiplier: Number(item.toFixed(2)),
              timeStr: getCurrentTimeStr(),
              houseName,
              createdAt: now - idx,
            });
          }
          return;
        }
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const rawMult = rec.multiplier ?? rec.vela ?? rec.odd ?? rec.valor;
          const mult =
            typeof rawMult === 'number' ? rawMult : parseMultiplier(String(rawMult ?? ''));
          if (!Number.isFinite(mult) || mult < 1) return;
          const rawRound = rec.roundNumber ?? rec.rodada ?? rec.id;
          const parsedRound = parseInt(String(rawRound ?? '').replace(/\D/g, ''), 10);
          const rawTime = rec.timeStr ?? rec.horario ?? rec.hora;
          entries.push({
            id: `${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            roundNumber: Number.isFinite(parsedRound) ? parsedRound : baseRound + idx,
            multiplier: Number(mult.toFixed(2)),
            timeStr: typeof rawTime === 'string' && rawTime.trim() ? rawTime.trim() : getCurrentTimeStr(),
            houseName,
            createdAt: now - idx,
          });
        }
      });
      if (entries.length > 0) {
        return newestFirst ? entries : entries.reverse();
      }
    } catch {
      // fall through to line/token parsing
    }
  }

  // Try structured multi-line parsing (#rodada, vela, horario)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    const structured: RoundEntry[] = [];
    const baseTime = getCurrentTimeStr();
    const now = Date.now();

    lines.forEach((line, idx) => {
      // Skip CSV headers
      if (/^(rodada|round|vela|multiplier|horario)/i.test(line)) return;
      const timeMatch = line.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
      const roundMatch = line.match(/(?:#|rodada\s*)(\d{4,10})/i) || line.match(/^(\d{5,10})[\s,;|\t]/);
      const cleanedForMult = line
        .replace(timeMatch?.[0] ?? '', ' ')
        .replace(roundMatch?.[0] ?? '', ' ');
      const multMatches = cleanedForMult.match(/\d+(?:[.,]\d{1,2})?x?/gi) ?? [];
      const mult = multMatches
        .map((m) => parseMultiplier(m))
        .find((n) => Number.isFinite(n) && n >= 1 && n <= 100000);

      if (mult !== undefined) {
        const parsedRound = roundMatch?.[1] ? parseInt(roundMatch[1], 10) : NaN;
        structured.push({
          id: `${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          roundNumber: Number.isFinite(parsedRound)
            ? parsedRound
            : newestFirst
              ? Math.max(1, baseRound - idx)
              : baseRound + idx,
          multiplier: mult,
          timeStr: timeMatch?.[1]
            ? timeMatch[1].length === 5
              ? `${timeMatch[1]}:00`
              : timeMatch[1]
            : addSecondsToTime(baseTime, idx * 20),
          houseName,
          createdAt: now - idx,
        });
      }
    });

    if (structured.length > 0) {
      return newestFirst ? structured : structured.reverse();
    }
  }

  // Fallback token list (e.g. "1.37 1.00 2.45 12.56")
  const tokens = trimmed
    .split(/[\s,;|]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const nums = tokens.map(parseMultiplier).filter((n) => Number.isFinite(n) && n >= 1);
  if (nums.length === 0) return [];

  const baseTime = getCurrentTimeStr();
  const now = Date.now();
  const entries: RoundEntry[] = nums.map((mult, idx) => ({
    id: `${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    roundNumber: newestFirst ? Math.max(1, baseRound - idx) : baseRound + idx,
    multiplier: mult,
    timeStr: addSecondsToTime(baseTime, idx * 20),
    houseName,
    createdAt: now + idx,
  }));

  return newestFirst ? entries : entries.reverse();
}

export function formatHistoryForShare(houseName: string, history: RoundEntry[]): string {
  const header = `Histórico Aviator — ${houseName} (${history.length} rodadas)`;
  const lines = history.map(
    (item) => `#${item.roundNumber} | ${item.multiplier.toFixed(2)}x | ${item.timeStr}`
  );
  return `${header}\n${lines.join('\n')}`;
}

export const HistoricoPadroesView: React.FC<HistoricoPadroesViewProps> = ({
  selectedHouse,
  history,
  searchLog,
  analysis,
  onBatchAdd,
  onRemoveEntry,
  onClearHouseHistory,
  onSelectEntryForSearch,
  onUpdateLogResult,
  onDeleteLogItem,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [batchText, setBatchText] = useState('');
  const [startRound, setStartRound] = useState('4310500');
  const [newestFirst, setNewestFirst] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const showTempFeedback = (msg: string) => {
    setShareFeedback(msg);
    setTimeout(() => setShareFeedback(null), 2600);
  };

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    const baseRound = parseInt(startRound.replace(/\D/g, ''), 10) || 100000;
    const entries = parseHistoryContent(batchText, selectedHouse, baseRound, newestFirst);

    if (entries.length === 0) {
      setBatchFeedback('Nenhuma vela válida encontrada. Ex: 1.37 1.00 2.45 10.75 ou arquivo .txt/.csv/.json.');
      return;
    }

    onBatchAdd(entries);
    setBatchText('');
    setBatchFeedback(`${entries.length} rodadas enviadas para o histórico de ${selectedHouse}`);
    setTimeout(() => setBatchFeedback(null), 2800);
  };

  const handleUploadHistoryFile = async (file: File | null | undefined) => {
    if (!file) return;
    try {
      const content = await file.text();
      const baseRound = parseInt(startRound.replace(/\D/g, ''), 10) || 100000;
      const entries = parseHistoryContent(content, selectedHouse, baseRound, newestFirst);

      if (entries.length === 0) {
        setBatchFeedback(`Não foi possível ler rodadas válidas no arquivo "${file.name}".`);
        return;
      }

      onBatchAdd(entries);
      setBatchFeedback(`${entries.length} rodadas carregadas de "${file.name}" para ${selectedHouse}`);
      setTimeout(() => setBatchFeedback(null), 3200);
    } catch {
      setBatchFeedback('Erro ao ler o arquivo de histórico.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTxt = () => {
    if (history.length === 0) return;
    const text = formatHistoryForShare(selectedHouse, history);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-${selectedHouse.toLowerCase().replace(/[^a-z0-9]/gi, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showTempFeedback('Arquivo .TXT do histórico baixado.');
  };

  const handleCopyHistory = async () => {
    if (history.length === 0) return;
    const text = formatHistoryForShare(selectedHouse, history);
    try {
      await navigator.clipboard.writeText(text);
      showTempFeedback('Histórico copiado para enviar onde quiser.');
    } catch {
      showTempFeedback('Não foi possível copiar automaticamente.');
    }
  };

  const handleShareHistory = async () => {
    if (history.length === 0) return;
    const text = formatHistoryForShare(selectedHouse, history);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Histórico Aviator — ${selectedHouse}`,
          text,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    await handleCopyHistory();
  };

  const greenCount = searchLog.filter((l) => l.result === 'green').length;
  const lossCount = searchLog.filter((l) => l.result === 'loss').length;
  const resolved = greenCount + lossCount;
  const winRate = resolved > 0 ? Math.round((greenCount / resolved) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Batch & File Importer Header */}
      <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Histórico & Padrões — {selectedHouse}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Envie um arquivo (.txt, .csv, .json) ou cole a sequência de rodadas para importar, analisar padrões e compartilhar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json,text/plain,text/csv,application/json"
              className="hidden"
              onChange={(e) => void handleUploadHistoryFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
            >
              <FileUp className="h-4 w-4" />
              <span>Enviar Arquivo (.txt / .csv / .json)</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHouseHistory}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleBatchImport} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label htmlFor="batch-start-round" className="block text-xs font-medium text-slate-300 mb-1.5">
                Rodada Base da Sequência
              </label>
              <input
                id="batch-start-round"
                type="text"
                inputMode="numeric"
                value={startRound}
                onChange={(e) => setStartRound(e.target.value.replace(/\D/g, ''))}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-6">
              <label htmlFor="batch-candles" className="block text-xs font-medium text-slate-300 mb-1.5">
                Colar Histórico de Rodadas / Velas (linha única ou várias linhas)
              </label>
              <textarea
                id="batch-candles"
                rows={2}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Ex: 1.45 1.12 1.00 1.37 1.00 12.56 ou cole linhas #4310524 | 12.56x | 16:21:23"
                className="w-full rounded-xl border border-white/15 bg-[#0B0F17] p-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-3 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-[#0B0F17] p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setNewestFirst(false)}
                  className={`min-h-[30px] flex-1 rounded-md px-2 text-[11px] font-medium transition-colors cursor-pointer ${
                    !newestFirst ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Antiga → Nova
                </button>
                <button
                  type="button"
                  onClick={() => setNewestFirst(true)}
                  className={`min-h-[30px] flex-1 rounded-md px-2 text-[11px] font-medium transition-colors cursor-pointer ${
                    newestFirst ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nova → Antiga
                </button>
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <ClipboardPaste className="h-4 w-4" />
                <span>Enviar para Histórico</span>
              </button>
            </div>
          </div>
        </form>

        {batchFeedback && (
          <p className="mt-2.5 text-xs font-medium text-emerald-300">{batchFeedback}</p>
        )}
      </section>

      {/* Send / Export / Share Saved History Bar */}
      {history.length > 0 && (
        <section className="rounded-2xl border border-emerald-500/30 bg-[#131A26] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Exportar e Compartilhar Histórico ({history.length} salvas)
              </h2>
              <p className="text-xs text-slate-400">
                Compartilhe, copie ou baixe em arquivo o histórico de rodadas da {selectedHouse}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleShareHistory()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-emerald-400" />
                <span>Compartilhar</span>
              </button>
              <button
                type="button"
                onClick={() => void handleCopyHistory()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Copy className="h-4 w-4 text-slate-300" />
                <span>Copiar Texto</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-300" />
                <span>Baixar .TXT</span>
              </button>
            </div>
          </div>

          {shareFeedback && (
            <p className="mt-2 text-xs font-medium text-emerald-300">{shareFeedback}</p>
          )}
        </section>
      )}

      {/* 2-Column Grid: Board + Sequence Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Histórico da Rodada ({history.length})
              </h2>
              <p className="text-xs text-slate-400">
                Azul/Roxo/Rosa conforme faixa oficial · Clique em uma célula para buscar entradas
              </p>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-sky-400">Azuis {analysis.boardStats.azulPct}%</span>
                <span className="text-violet-400">Roxos {analysis.boardStats.roxoPct}%</span>
                <span className="text-pink-400">Rosas {analysis.boardStats.rosaPct}%</span>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-xl bg-[#0B0F17] p-8 text-center text-sm text-slate-400">
              Nenhuma rodada registrada para <strong className="text-slate-200">{selectedHouse}</strong> ainda. Registre pelo Buscador, envie um arquivo ou cole uma sequência acima.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {history.map((item) => {
                const isRosa = item.multiplier >= 10;
                const isRoxo = item.multiplier >= 2 && item.multiplier < 10;
                const cls = isRosa
                  ? 'border-pink-500/40 bg-pink-500/15 text-pink-200 hover:border-pink-400'
                  : isRoxo
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-200 hover:border-violet-400'
                    : 'border-sky-500/35 bg-sky-500/12 text-sky-200 hover:border-sky-400';
                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-colors ${cls}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectEntryForSearch(item)}
                      className="w-full text-center cursor-pointer"
                    >
                      <div className="font-mono text-sm font-bold">{item.multiplier.toFixed(2)}x</div>
                      <div className="mt-0.5 font-mono text-[10px] opacity-75">#{item.roundNumber}</div>
                      <div className="font-mono text-[10px] opacity-60">{item.timeStr}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveEntry(item.id)}
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded bg-black/50 text-slate-300 group-hover:flex hover:text-white cursor-pointer"
                      aria-label="Remover rodada"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sequence Alerts & Search Log */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
            <h2 className="text-base font-semibold text-slate-100">
              Leitura de Padrões & Ciclos
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Avaliação automática das velas de {selectedHouse}
            </p>

            {history.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-[#0B0F17] p-3">
                  <div className="text-slate-500">Saúde do Gráfico</div>
                  <div
                    className={`mt-0.5 font-semibold ${
                      analysis.boardStats.isHealthyGraph ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {analysis.boardStats.isHealthyGraph ? 'Pagante (Roxo/Rosa ≥ Azul)' : 'Recolhe (Mais Azuis)'}
                  </div>
                </div>
                <div className="rounded-xl bg-[#0B0F17] p-3">
                  <div className="text-slate-500">Média das Roxas</div>
                  <div className="mt-0.5 font-mono font-semibold text-slate-100">
                    {analysis.boardStats.roxoAvg > 0 ? `${analysis.boardStats.roxoAvg.toFixed(2)}x` : '—'}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {analysis.sequenceAlerts.length === 0 ? (
                <div className="rounded-xl bg-[#0B0F17] p-4 text-xs text-slate-400">
                  Nenhum padrão de sequência crítico ativo no momento. Continue registrando as velas para detectar Pares de Rosa, 4 Roxos + Azul ou Reset 1.00x.
                </div>
              ) : (
                analysis.sequenceAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-3 text-xs ${
                      alert.severity === 'perigo'
                        ? 'border-red-500/35 bg-red-500/10 text-red-200'
                        : alert.severity === 'alerta'
                          ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
                          : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                    }`}
                  >
                    <div className="font-semibold">{alert.title}</div>
                    <div className="mt-0.5 text-[11px] opacity-80">{alert.source}</div>
                    <p className="mt-1 opacity-90">{alert.description}</p>
                    <p className="mt-1 font-medium">Ação: {alert.action}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Saved Search Log */}
          <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Log de Entradas Salvas</h2>
                <p className="text-xs text-slate-400">
                  {resolved > 0
                    ? `Assertividade: ${winRate}% (${greenCount} Green · ${lossCount} Loss)`
                    : 'Marque Green ou Loss para medir seus resultados'}
                </p>
              </div>
            </div>

            {searchLog.length === 0 ? (
              <div className="mt-4 rounded-xl bg-[#0B0F17] p-4 text-xs text-slate-400">
                Use o botão <strong className="text-slate-200">Salvar Busca</strong> no Buscador para acompanhar suas entradas.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-white/10 max-h-[340px] overflow-y-auto pr-1">
                {searchLog.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-slate-100 truncate">
                        #{log.roundNumber} · {log.multiplier.toFixed(2)}x · {log.houseName}
                      </div>
                      <div className="text-slate-400 truncate mt-0.5">{log.topTargets}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateLogResult(log.id, 'green')}
                        className={`min-h-[34px] min-w-[34px] rounded-lg border px-2 font-medium cursor-pointer ${
                          log.result === 'green'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-white/10 bg-[#0B0F17] text-slate-400 hover:text-emerald-300'
                        }`}
                        title="Marcar Green"
                      >
                        <Check className="h-3.5 w-3.5 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateLogResult(log.id, 'loss')}
                        className={`min-h-[34px] min-w-[34px] rounded-lg border px-2 font-medium cursor-pointer ${
                          log.result === 'loss'
                            ? 'border-red-500 bg-red-500/20 text-red-300'
                            : 'border-white/10 bg-[#0B0F17] text-slate-400 hover:text-red-300'
                        }`}
                        title="Marcar Loss"
                      >
                        <X className="h-3.5 w-3.5 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLogItem(log.id)}
                        className="min-h-[34px] min-w-[34px] rounded-lg text-slate-500 hover:text-slate-200 cursor-pointer flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
