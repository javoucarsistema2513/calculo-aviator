import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Link2,
  MessageCircle,
  Send,
  Share2,
  X,
} from 'lucide-react';
import {
  AnalysisResult,
  EntryMode,
  PaceMode,
  PayoutMood,
  ProjectedRound,
} from '../utils/aviatorEngine';

export type ShareScope = 'entradas' | 'mapa_completo' | 'rodada_unica';

interface ShareRoundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseName: string;
  analysis: AnalysisResult;
  mapRange: 15 | 30;
  entryMode: EntryMode;
  payoutMood: PayoutMood;
  paceMode: PaceMode;
  focusedProjected?: ProjectedRound | null;
}

export function buildShareUrl(params: {
  houseName: string;
  roundNumber: number;
  multiplier: number;
  timeStr: string;
  entryMode: EntryMode;
  payoutMood: PayoutMood;
  paceMode: PaceMode;
}): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('house', params.houseName);
  url.searchParams.set('round', String(params.roundNumber));
  url.searchParams.set('mult', params.multiplier.toFixed(2));
  url.searchParams.set('time', params.timeStr);
  url.searchParams.set('mode', params.entryMode);
  url.searchParams.set('mood', params.payoutMood);
  url.searchParams.set('pace', params.paceMode);
  return url.toString();
}

export function formatFutureRoundsShareText(params: {
  houseName: string;
  analysis: AnalysisResult;
  mapRange: 15 | 30;
  scope: ShareScope;
  focusedProjected?: ProjectedRound | null;
  includeLink: boolean;
  shareUrl: string;
}): string {
  const {
    houseName,
    analysis,
    mapRange,
    scope,
    focusedProjected,
    includeLink,
    shareUrl,
  } = params;

  const lines: string[] = [];
  lines.push(`✈️ AVIATOR RADAR PRO — ${houseName}`);
  lines.push(
    `Base: #${analysis.roundNumber} | Última Vela: ${analysis.diagnostic.formatted} (${analysis.timeStr})`
  );
  lines.push(`Cadência: ${analysis.pace.label}`);
  lines.push(
    `Radar: ${analysis.radarVerdict.status} | Gráfico: ${analysis.radarVerdict.graphPhase} | Pico: ${analysis.radarVerdict.assertivityScore}%`
  );
  lines.push('');

  if (scope === 'rodada_unica' && focusedProjected) {
    const p = focusedProjected;
    const colorTag =
      p.expectedColor === 'rosa' ? '🌸 ROSA' : p.expectedColor === 'roxo' ? '🟣 ROXA' : '';
    lines.push(
      `🎯 RODADA FUTURA DESTACADA: #${p.roundNumber} (Casa +${p.offset})${colorTag ? ` [${colorTag}]` : ''}`
    );
    lines.push(`⏰ Horário Estimado: ~${p.estimatedTime}`);
    lines.push(
      `📊 Precisão: ${p.precisionScore}% (${p.confluenceCount} ${
        p.confluenceCount === 1 ? 'confluência' : 'confluências'
      })${p.isStrongMinute ? ' · Minuto Forte' : ''}`
    );
    if (p.recommendedTarget) {
      lines.push(`🚀 Alvo Sugerido: ${p.recommendedTarget}`);
    }
    if (p.matchingSignals.length > 0) {
      lines.push('📌 Gatilhos Ativos:');
      for (const sig of p.matchingSignals) {
        lines.push(
          `• ${sig.title} | Alvo ${sig.targetMultiplier} (Prot. ${sig.protection})`
        );
      }
    } else if (p.isResetStrongHouse) {
      lines.push('• Casa forte pós-reset 1.00x (Proteção 1.49x)');
    } else if (p.isOddRule13) {
      lines.push('• Casa ímpar na Regra dos 13 pós-vela +30x');
    }
  } else {
    if (analysis.topConfluences.length > 0) {
      lines.push('🔥 TOP CONFLUÊNCIAS (MAIOR PRECISÃO):');
      for (const item of analysis.topConfluences) {
        const cTag = item.expectedColor === 'rosa' ? '🌸 ROSA' : '🟣 ROXA';
        lines.push(
          `• ${cTag} #${item.roundNumber} (+${item.offset}) ~${item.estimatedTime} | ${item.precisionScore}% (${item.confluenceCount}x) | Alvo ${item.targetMultiplier} (Prot. ${item.protection})`
        );
      }
      lines.push('');
    }

    const slice = analysis.projectedRounds.slice(0, mapRange);

    if (scope === 'entradas') {
      const entryRounds = slice.filter(
        (p) =>
          p.matchingSignals.length > 0 ||
          p.isResetStrongHouse ||
          p.isOddRule13
      );
      if (entryRounds.length > 0) {
        lines.push(`🎯 PRÓXIMAS ENTRADAS (${mapRange} RODADAS):`);
        for (const p of entryRounds) {
          const cTag = p.expectedColor === 'rosa' ? '🌸 ROSA ' : p.expectedColor === 'roxo' ? '🟣 ROXA ' : '';
          const tag = p.tier === 'confluencia' ? '★ ' : '';
          const target = p.recommendedTarget ? ` · Alvo ${p.recommendedTarget}` : '';
          lines.push(
            `${tag}${cTag}+${p.offset} | #${p.roundNumber} | ~${p.estimatedTime} | ${p.precisionScore}%${target}`
          );
        }
      } else {
        lines.push('⏳ Sem gatilhos diretos nas próximas rodadas; acompanhe os minutos abaixo:');
        for (const s of analysis.signals.slice(0, 5)) {
          lines.push(`• ${s.title}: ${s.targetTime} (Alvo ${s.targetMultiplier})`);
        }
      }
    } else {
      lines.push(`🗺️ MAPA COMPLETO (PRÓXIMAS ${mapRange} RODADAS):`);
      for (const p of slice) {
        const cTag = p.expectedColor === 'rosa' ? '🌸 ROSA' : p.expectedColor === 'roxo' ? '🟣 ROXA' : '';
        const badge =
          p.tier === 'confluencia'
            ? `🔥 ${cTag} ${p.precisionScore}% (${p.confluenceCount}x)`
            : p.tier === 'entrada'
              ? `${cTag} ${p.precisionScore}%`
              : p.tier === 'atencao'
                ? '⚠️ MIN FORTE'
                : '—';
        const target = p.recommendedTarget ? ` · ${p.recommendedTarget}` : '';
        lines.push(
          `+${String(p.offset).padStart(2, '0')} | #${p.roundNumber} | ${p.estimatedTime} | ${badge}${target}`
        );
      }
    }
  }

  if (includeLink && shareUrl) {
    lines.push('');
    lines.push(`🔗 Abrir análise no Radar: ${shareUrl}`);
  }

  lines.push('');
  lines.push('⚠️ Gerencie sua banca com responsabilidade.');

  return lines.join('\n');
}

export const ShareRoundsModal: React.FC<ShareRoundsModalProps> = ({
  isOpen,
  onClose,
  houseName,
  analysis,
  mapRange,
  entryMode,
  payoutMood,
  paceMode,
  focusedProjected,
}) => {
  const [scope, setScope] = useState<ShareScope>(
    focusedProjected ? 'rodada_unica' : 'entradas'
  );
  const [includeLink, setIncludeLink] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [nativeFeedback, setNativeFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScope(focusedProjected ? 'rodada_unica' : 'entradas');
      setCopiedText(false);
      setCopiedLink(false);
      setNativeFeedback(null);
    }
  }, [isOpen, focusedProjected]);

  const shareUrl = useMemo(() => {
    if (!analysis.valid) return '';
    return buildShareUrl({
      houseName,
      roundNumber: analysis.roundNumber,
      multiplier: analysis.multiplier,
      timeStr: analysis.timeStr,
      entryMode,
      payoutMood,
      paceMode,
    });
  }, [analysis, houseName, entryMode, payoutMood, paceMode]);

  const shareText = useMemo(() => {
    if (!analysis.valid) return '';
    return formatFutureRoundsShareText({
      houseName,
      analysis,
      mapRange,
      scope,
      focusedProjected,
      includeLink,
      shareUrl,
    });
  }, [analysis, houseName, mapRange, scope, focusedProjected, includeLink, shareUrl]);

  if (!isOpen || !analysis.valid) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      setNativeFeedback('Não foi possível copiar automaticamente. Selecione o texto acima.');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setNativeFeedback('Não foi possível copiar o link.');
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      await handleCopyText();
      return;
    }
    try {
      await navigator.share({
        title: `Aviator Radar Pro — ${houseName} (#${analysis.roundNumber})`,
        text: shareText,
        ...(includeLink && shareUrl ? { url: shareUrl } : {}),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      await handleCopyText();
      setNativeFeedback('Texto copiado para a área de transferência.');
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl || window.location.origin
  )}&text=${encodeURIComponent(shareText)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-xl rounded-t-2xl sm:rounded-2xl border border-white/15 bg-[#131A26] p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <h3 id="share-modal-title" className="text-base font-semibold text-slate-100">
              Compartilhar Futuras Rodadas — {houseName}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Envie as projeções da rodada <span className="font-mono text-slate-200">#{analysis.roundNumber}</span> para WhatsApp, Telegram ou copie o resumo pronto.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de compartilhamento"
            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-white/10 bg-[#0B0F17] text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {focusedProjected && (
            <button
              type="button"
              onClick={() => setScope('rodada_unica')}
              className={`min-h-[36px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer ${
                scope === 'rodada_unica'
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                  : 'border-white/10 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
              }`}
            >
              Rodada #{focusedProjected.roundNumber}
            </button>
          )}
          <button
            type="button"
            onClick={() => setScope('entradas')}
            className={`min-h-[36px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer ${
              scope === 'entradas'
                ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                : 'border-white/10 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
            }`}
          >
            Top & Entradas ({mapRange} rod.)
          </button>
          <button
            type="button"
            onClick={() => setScope('mapa_completo')}
            className={`min-h-[36px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer ${
              scope === 'mapa_completo'
                ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                : 'border-white/10 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
            }`}
          >
            Mapa Completo ({mapRange} rodadas)
          </button>
        </div>

        {/* Include Direct Link Toggle */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeLink}
              onChange={(e) => setIncludeLink(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#0B0F17] accent-emerald-500 cursor-pointer"
            />
            <span>Incluir link direto para abrir esta análise no Radar</span>
          </label>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link copiado!' : 'Copiar apenas link'}</span>
          </button>
        </div>

        {/* Formatted Preview */}
        <div className="mt-3">
          <label htmlFor="share-preview-textarea" className="sr-only">
            Prévia da mensagem para compartilhar
          </label>
          <textarea
            id="share-preview-textarea"
            readOnly
            value={shareText}
            rows={10}
            className="w-full rounded-xl border border-white/15 bg-[#0B0F17] p-3 font-mono text-xs text-slate-200 leading-relaxed focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {nativeFeedback && (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            {nativeFeedback}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>{canNativeShare ? 'Compartilhar' : 'Enviar / Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3 text-xs font-semibold text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-300 shrink-0" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition-colors"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>WhatsApp</span>
          </a>

          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 transition-colors"
          >
            <Send className="h-4 w-4 shrink-0" />
            <span>Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
};
