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
  PayoutMood,
  SuperCandleAnalysis,
  SuperCandleHourValue,
} from '../utils/aviatorEngine';

interface ShareSuperVelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseName: string;
  analysis: SuperCandleAnalysis;
  payoutMood: PayoutMood;
  selectedCycleHours: SuperCandleHourValue[];
  focusedHour?: SuperCandleHourValue | null;
}

export function buildSuperVelasShareUrl(params: {
  houseName: string;
  roundNumber: number | null;
  multiplier: number;
  dateStr: string;
  timeStr: string;
  payoutMood: PayoutMood;
}): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('tab', 'supervelas');
  url.searchParams.set('house', params.houseName);
  if (params.roundNumber) {
    url.searchParams.set('sround', String(params.roundNumber));
  }
  url.searchParams.set('smult', params.multiplier.toFixed(2));
  url.searchParams.set('sdate', params.dateStr);
  url.searchParams.set('stime', params.timeStr);
  url.searchParams.set('smood', params.payoutMood);
  return url.toString();
}

export function formatSuperVelasShareText(params: {
  houseName: string;
  analysis: SuperCandleAnalysis;
  hoursToShare: SuperCandleHourValue[];
  includeShortWindows: boolean;
  includeLink: boolean;
  shareUrl: string;
}): string {
  const {
    houseName,
    analysis,
    hoursToShare,
    includeShortWindows,
    includeLink,
    shareUrl,
  } = params;

  const lines: string[] = [];
  lines.push(`🔥 SUPER VELAS ALTAS — ${houseName}`);
  lines.push(
    `Vela Base: ${analysis.multiplier.toFixed(2)}x (${analysis.tierLabel}) | Data: ${analysis.formattedDateStr} | Hora: ${analysis.timeStr}${
      analysis.roundNumber ? ` | Rodada: #${analysis.roundNumber}` : ''
    }`
  );
  lines.push(`📐 Decimal: ${analysis.decimalFormula}`);
  if (analysis.roundDigitFormula) {
    lines.push(`🎯 Dígito da Rodada: ${analysis.roundDigitFormula}`);
  }
  lines.push('');

  const filteredCycles = analysis.hourCycles.filter((c) => hoursToShare.includes(c.hours));
  if (filteredCycles.length > 0) {
    lines.push('⏰ PADRÕES DE ENTRADA (7h · 12h · 24h · 34h):');
    for (const c of filteredCycles) {
      const roundStr = c.estimatedRound ? ` | Rodada Est. #${c.estimatedRound}` : '';
      const strongTag = c.isStrongMinute || c.isDecimalStrongMinute ? ' ⭐ MIN FORTE' : '';
      lines.push(
        `🌸 +${c.hours}h (${c.dayOffsetLabel}): 📅 ${c.exactDate} às ${c.exactTime} (Janela ${c.entryWindowWithDate}) | Decimal: ${c.decimalAdjustedDate} às ${c.decimalAdjustedTime}${roundStr} | Alvo ${c.targetMultiplier}${strongTag}`
      );
    }
  }

  if (includeShortWindows && analysis.shortWindows.length > 0) {
    lines.push('');
    lines.push('⏱️ JANELAS CURTO PRAZO:');
    for (const w of analysis.shortWindows) {
      const cTag = w.expectedColor === 'rosa' ? '🌸 ROSA' : '🟣 ROXA';
      const rStr = w.estimatedRound ? ` (#${w.estimatedRound})` : '';
      lines.push(`• ${w.label}: ${w.targetDate} ${w.targetTime}${rStr} | ${cTag} ${w.targetMultiplier}`);
    }
  }

  if (includeLink && shareUrl) {
    lines.push('');
    lines.push(`🔗 Abrir cálculo de Super Velas: ${shareUrl}`);
  }

  lines.push('');
  lines.push('🛡️ Proteção recomendada: 1.49x / 2.00x. Gerencie sua banca.');
  return lines.join('\n');
}

export const ShareSuperVelasModal: React.FC<ShareSuperVelasModalProps> = ({
  isOpen,
  onClose,
  houseName,
  analysis,
  payoutMood,
  selectedCycleHours,
  focusedHour,
}) => {
  const [hoursToShare, setHoursToShare] = useState<SuperCandleHourValue[]>(selectedCycleHours);
  const [includeShortWindows, setIncludeShortWindows] = useState(true);
  const [includeLink, setIncludeLink] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHoursToShare(focusedHour ? [focusedHour] : selectedCycleHours);
      setCopiedText(false);
      setCopiedLink(false);
      setFeedback(null);
    }
  }, [isOpen, focusedHour, selectedCycleHours]);

  const shareUrl = useMemo(() => {
    if (!analysis.valid) return '';
    return buildSuperVelasShareUrl({
      houseName,
      roundNumber: analysis.roundNumber,
      multiplier: analysis.multiplier,
      dateStr: analysis.dateStr,
      timeStr: analysis.timeStr,
      payoutMood,
    });
  }, [analysis, houseName, payoutMood]);

  const shareText = useMemo(() => {
    if (!analysis.valid) return '';
    return formatSuperVelasShareText({
      houseName,
      analysis,
      hoursToShare: hoursToShare.length > 0 ? hoursToShare : [7, 12, 24, 34],
      includeShortWindows,
      includeLink,
      shareUrl,
    });
  }, [analysis, houseName, hoursToShare, includeShortWindows, includeLink, shareUrl]);

  if (!isOpen || !analysis.valid) return null;

  const toggleHour = (h: SuperCandleHourValue) => {
    setHoursToShare((prev) => {
      if (prev.includes(h)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== h);
      }
      return [...prev, h].sort((a, b) => a - b);
    });
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      setFeedback('Não foi possível copiar automaticamente. Selecione o texto acima.');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setFeedback('Não foi possível copiar o link.');
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      await handleCopyText();
      return;
    }
    try {
      await navigator.share({
        title: `Super Velas 7h/12h/24h/34h — ${houseName} (${analysis.multiplier.toFixed(2)}x)`,
        text: shareText,
        ...(includeLink && shareUrl ? { url: shareUrl } : {}),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      await handleCopyText();
      setFeedback('Texto copiado para a área de transferência.');
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
      aria-labelledby="share-super-title"
    >
      <div className="w-full max-w-xl rounded-t-2xl sm:rounded-2xl border border-pink-500/35 bg-[#131A26] p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <h3 id="share-super-title" className="text-base font-semibold text-slate-100">
              Compartilhar Padrões Super Velas — {houseName}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Vela <span className="font-mono text-pink-300">{analysis.multiplier.toFixed(2)}x</span> em{' '}
              <span className="font-mono text-slate-200">{analysis.formattedDateStr}</span> às{' '}
              <span className="font-mono text-slate-200">{analysis.timeStr}</span>
              {analysis.roundNumber ? ` · Rodada #${analysis.roundNumber}` : ''}
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

        {/* Select Cycles to Share */}
        <div className="mt-4">
          <div className="text-xs font-medium text-slate-300 mb-2">
            Selecione os ciclos para compartilhar:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([7, 12, 24, 34] as SuperCandleHourValue[]).map((h) => {
              const active = hoursToShare.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleHour(h)}
                  className={`min-h-[36px] rounded-lg border px-3 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'border-pink-400 bg-pink-500/25 text-pink-100'
                      : 'border-white/10 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  +{h} horas
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setHoursToShare([7, 12, 24, 34])}
              className="min-h-[36px] rounded-lg border border-white/10 bg-[#192231] px-3 text-xs font-medium text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              Todos
            </button>
          </div>
        </div>

        {/* Extra Toggles */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeShortWindows}
                onChange={(e) => setIncludeShortWindows(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#0B0F17] accent-pink-500 cursor-pointer"
              />
              <span>Incluir janelas curtas (+30m/+1h)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLink}
                onChange={(e) => setIncludeLink(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#0B0F17] accent-pink-500 cursor-pointer"
              />
              <span>Incluir link direto</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-pink-300 hover:text-pink-200 cursor-pointer"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link copiado!' : 'Copiar link'}</span>
          </button>
        </div>

        {/* Preview */}
        <div className="mt-3">
          <label htmlFor="share-super-textarea" className="sr-only">
            Prévia dos padrões de 7h, 12h, 24h e 34h
          </label>
          <textarea
            id="share-super-textarea"
            readOnly
            value={shareText}
            rows={10}
            className="w-full rounded-xl border border-white/15 bg-[#0B0F17] p-3 font-mono text-xs text-slate-200 leading-relaxed focus:border-pink-400 focus:outline-none"
          />
        </div>

        {feedback && (
          <div className="mt-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-xs text-pink-200">
            {feedback}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-pink-600 px-3 text-xs font-semibold text-white hover:bg-pink-500 transition-colors cursor-pointer"
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
