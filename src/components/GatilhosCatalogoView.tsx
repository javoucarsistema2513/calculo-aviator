import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  BEST_HOURS,
  EXACT_TRIGGER_RULES,
  PAIRED_HOUSES,
  ROSE_PAIRS,
  STRONG_MINUTE_SUFFIXES,
} from '../data/aviatorRules';

interface GatilhosCatalogoViewProps {
  onSelectHouse: (house: string) => void;
  onApplyCandle: (candleStr: string) => void;
}

type CatalogSection = 'gatilhos' | 'pares' | 'formulas' | 'casas';

export const GatilhosCatalogoView: React.FC<GatilhosCatalogoViewProps> = ({
  onSelectHouse,
  onApplyCandle,
}) => {
  const [section, setSection] = useState<CatalogSection>('gatilhos');
  const [query, setQuery] = useState('');

  const filteredTriggers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXACT_TRIGGER_RULES;
    return EXACT_TRIGGER_RULES.filter(
      (r) =>
        r.candle.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        r.entries.toLowerCase().includes(q) ||
        (r.note && r.note.toLowerCase().includes(q))
    );
  }, [query]);

  const filteredHouses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAIRED_HOUSES;
    return PAIRED_HOUSES.filter(
      (h) =>
        h.primary.toLowerCase().includes(q) ||
        h.paired.toLowerCase().includes(q) ||
        (h.groupNote && h.groupNote.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Catálogo Completo dos PDFs
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Todas as velas de gatilho, pares de rosas, fórmulas de horário e casas de apostas pareadas dos Módulos 1 ao 5 e Treinamento III.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar vela (1.37) ou casa..."
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5 rounded-xl bg-[#0B0F17] p-1 border border-white/10 w-fit">
          {[
            { id: 'gatilhos', label: 'Velas de Gatilho' },
            { id: 'pares', label: '21 Pares de Rosa' },
            { id: 'formulas', label: 'Fórmulas & Horários' },
            { id: 'casas', label: 'Casas Iguais' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as CatalogSection)}
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                section === tab.id ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {section === 'gatilhos' && (
        <section className="rounded-2xl border border-white/10 bg-[#131A26] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-[#0B0F17] text-xs font-medium text-slate-400">
                <tr>
                  <th className="px-4 py-3">Vela Gatilho</th>
                  <th className="px-4 py-3">Puxa / Alvo</th>
                  <th className="px-4 py-3">Proteção</th>
                  <th className="px-4 py-3">Execução</th>
                  <th className="px-4 py-3">Origem PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTriggers.map((rule) => (
                  <tr
                    key={rule.candle}
                    onClick={() => onApplyCandle(rule.minVal.toFixed(2))}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-100 whitespace-nowrap">
                      {rule.candle}
                      {rule.isSpecial && (
                        <span className="ml-2 text-[11px] font-sans font-medium text-emerald-400">
                          Especial
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{rule.target}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{rule.protection}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <div>{rule.entries}</div>
                      {rule.note && <div className="mt-0.5 text-slate-400">{rule.note}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{rule.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'pares' && (
        <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-100">
            Pares Gatilhos de Rosas (Módulo 4 p.17 e p.52)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Quando duas velas consecutivas formarem um destes pares no histórico, iniciar entradas fixas com proteção em 1.49x buscando Rosa.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {ROSE_PAIRS.map((pair) => (
              <div
                key={pair.label}
                className="rounded-xl border border-pink-500/25 bg-[#0B0F17] px-3 py-3 text-center font-mono text-sm font-semibold text-pink-300"
              >
                {pair.label}
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'formulas' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">Regras de Tempo por Faixa de Vela</h2>
            <div className="divide-y divide-white/10 text-sm">
              {[
                { title: 'Dígito da Rodada + Horário (Mód. 5 p.1)', desc: 'Somar último dígito do número da rodada aos minutos do horário completo da vela.' },
                { title: '1º Dígito após o Ponto (Mód. 5 p.4/33)', desc: 'Ex: 10.79x às 17:01:30 → +7 min = 17:08:30 (buscar roxo/rosa e evitar reds).' },
                { title: 'Subtração de Vela (Mód. 5 p.3)', desc: 'Ex: 37.89x → |7-3|=4 e |9-8|=1 → 4+1 = +5 min no horário para Rosa.' },
                { title: 'Velas de 2x (Mód. 4 p.12)', desc: 'Base 1.99x a 2.99x → +3 minutos. 3 entradas 15s antes (G2) ou 2 no minuto exato (G1).' },
                { title: 'Velas de 3x (Mód. 4 p.15)', desc: 'Base +7.00x → +60 minutos (1 hora à frente no mesmo minuto).' },
                { title: 'Velas de 5x (Mód. 4 p.19)', desc: 'Base +10.00x → +10 minutos. Entrar até 20s antes, 3 entradas no minuto.' },
                { title: 'Velas de 10x (Mód. 4 p.23)', desc: 'Base +20.00x → +20 minutos. Entrar até 30s antes, até 4 entradas no minuto.' },
                { title: 'Velas de 50x / 100x (Mód. 4 p.31–41)', desc: 'Base 60x–105x+ → +30 min (positivo) ou +32 e +35 min (negativo). Máx 3 acréscimos de +10m.' },
                { title: 'Regra dos 13 (Mód. 4 p.48)', desc: 'Vela +30x paga outra alta em até 13 casas (95% nas ímpares: 1, 3, 5, 7, 9, 11, 13).' },
              ].map((item) => (
                <div key={item.title} className="py-3 first:pt-0 last:pb-0">
                  <div className="font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Melhores Horários & Minutos Fortes</h2>
              <p className="mt-1 text-xs text-slate-400">Referência oficial do Módulo 4 p.50</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BEST_HOURS.map((h) => (
                  <div key={h.label} className="rounded-xl bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm font-semibold text-emerald-300">
                    {h.label}
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-[#0B0F17] p-3 text-xs text-slate-300">
                Minutos terminados em <span className="font-mono font-semibold text-amber-300">{STRONG_MINUTE_SUFFIXES.join(' / ')}</span> são os mais fortes para puxar velas altas.
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-slate-100">Dica de Ouro 2 — Análise de Finais</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Velas roxas com final <strong className="text-red-300">7</strong>: 80% puxa REDS (cautela).</li>
                <li>• Velas roxas com final <strong className="text-emerald-300">1</strong>: 80% puxa 2x+.</li>
                <li>• Velas roxas e azuis com final <strong className="text-violet-300">5</strong>: puxa roxo 2x.</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {section === 'casas' && (
        <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-100">
            Casas de Apostas Iguais / Pareadas (Módulo 4 p.9)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Clique em qualquer casa abaixo para selecioná-la imediatamente no Buscador. Você também pode adicionar qualquer outra casa livremente.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHouses.map((pair) => (
              <div
                key={`${pair.primary}-${pair.paired}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0B0F17] p-3"
              >
                <button
                  type="button"
                  onClick={() => onSelectHouse(pair.primary)}
                  className="text-left text-sm font-semibold text-slate-100 hover:text-emerald-300 cursor-pointer"
                >
                  {pair.primary}
                </button>
                <span className="text-xs text-slate-500">↔</span>
                <button
                  type="button"
                  onClick={() => onSelectHouse(pair.paired)}
                  className="text-right text-sm font-medium text-slate-300 hover:text-emerald-300 cursor-pointer"
                >
                  {pair.paired}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
