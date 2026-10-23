import React, { useState } from 'react';
import { BookOpen, Sparkles, Clock, Flame, ShieldAlert, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const StudyGuideTab: React.FC = () => {
  const [openSection, setOpenSection] = useState<string>('mod1');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
          <BookOpen className="w-3.5 h-3.5" /> Apostila Completa & Mentoria
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Compêndio de Estudos • Pai do Aviator
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
          Todos os ensinamentos, estratégias de quebra, gatilhos de velas baixas, regras de sinais e fechamentos de decimais extraídos diretamente dos Módulos I, II, III, IV, V e Treinamento Avançado.
        </p>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {/* MÓDULO 1 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition">
          <button
            onClick={() => toggleSection('mod1')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center">
                I
              </span>
              <div>
                <span className="text-sm sm:text-base font-black">Módulo 1 • Conhecendo o Gráfico & Os 3 Momentos</span>
                <p className="text-xs text-zinc-400 font-normal mt-0.5">Azul (60%), Roxo (30%), Rosa (10%) e Padrão Xadrez</p>
              </div>
            </div>
            {openSection === 'mod1' ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>

          {openSection === 'mod1' && (
            <div className="p-4 sm:p-6 border-t border-zinc-800/80 bg-zinc-950/60 text-xs sm:text-sm text-zinc-300 space-y-3">
              <p>
                O gráfico do Aviator é dividido matematicamente em <strong>3 momentos fundamentais</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-blue-400">Azul (&lt; 2.00x)</strong>: Ocupa ~60% de todas as rodadas. <em>"Quem comanda o game é o azul."</em></li>
                <li><strong className="text-purple-400">Roxo (2.00x a 9.99x)</strong>: Ocupa ~30% do gráfico. Momento base para consolidação de banca.</li>
                <li><strong className="text-rose-400">Rosa (10.00x ou mais)</strong>: Ocupa os cobiçados ~10% do topo.</li>
              </ul>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 mt-2">
                <strong className="text-white block font-bold">Padrão de Xadrez & Alternância:</strong>
                <p className="text-zinc-400 text-xs">
                  A alternância entre positivo (roxo/rosa) e negativo (azul) chama-se xadrez. A mentoria destaca: <strong>os padrões não se repetem por mais de 3x seguidas</strong>! Fique muito atento para pegar a quebra.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MÓDULO 2 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition">
          <button
            onClick={() => toggleSection('mod2')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-black text-xs flex items-center justify-center">
                II
              </span>
              <div>
                <span className="text-sm sm:text-base font-black">Módulo 2 • Estratégias para Roxo & Tempo</span>
                <p className="text-xs text-zinc-400 font-normal mt-0.5">Contagem de casas pós-rosa, Horário + Decimal da rodada</p>
              </div>
            </div>
            {openSection === 'mod2' ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>

          {openSection === 'mod2' && (
            <div className="p-4 sm:p-6 border-t border-zinc-800/80 bg-zinc-950/60 text-xs sm:text-sm text-zinc-300 space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">1. Contagem de 5 a 6 Casas pós-Rosa:</strong>
                <p className="text-xs text-zinc-400">
                  Após o surgimento de uma vela rosa (+10x), conte 5 a 6 casas para frente e inicie as entradas para buscar o roxo. (Válido quando o gráfico estiver no ciclo pague e respeitando os padrões).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">2. Horário da Vela + Decimal da Rodada:</strong>
                <p className="text-xs text-zinc-400">
                  Pegue uma vela roxa e abra o histórico da rodada da mesma. Some o minuto da vela com o último dígito da ID da rodada. Ex: Horário 17:33 com rodada 1809347 (final 7) = 17:40 para buscar 2x ou mais!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">3. Média do Roxo:</strong>
                <p className="text-xs text-zinc-400">
                  Se a média dos roxos for de 2.60x para cima, continuará pagando roxo. Se der roxos baixos como 2.02x, o gráfico está em queda e a chance de azul é alta: não arrisque seu capital!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MÓDULO 3 & 4 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition">
          <button
            onClick={() => toggleSection('mod34')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center">
                IV
              </span>
              <div>
                <span className="text-sm sm:text-base font-black">Módulo 4 • Regra dos 13, Velas Baixas & Melhores Horários</span>
                <p className="text-xs text-zinc-400 font-normal mt-0.5">Gatilhos de 2x a 100x, casas ímpares e minutos fortes</p>
              </div>
            </div>
            {openSection === 'mod34' ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>

          {openSection === 'mod34' && (
            <div className="p-4 sm:p-6 border-t border-zinc-800/80 bg-zinc-950/60 text-xs sm:text-sm text-zinc-300 space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-800/30 space-y-1.5">
                <strong className="text-rose-400 block font-bold">A Regra dos 13 (Velas +30x):</strong>
                <p className="text-xs text-zinc-300">
                  Quando sai uma vela alta (+30x), a plataforma costuma pagar outra vela alta em até 13 casas. Cerca de 95% das vezes pagam em CASAS ÍMPARES (1ª, 3ª, 5ª, 7ª, 9ª, 11ª, 13ª). É muito raro pagar em casa par.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">Melhores Horários & Minutos Fortes:</strong>
                <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-0.5">
                  <li><strong>Minutos Fortes:</strong> minutos terminados em 00, 05 e 09.</li>
                  <li><strong>Horários Recomendados:</strong> 06:00 às 09:00 / 13:00 às 14:00 / 16:30 às 17:40 / 20:00 às 21:00 / 00:00 às 02:00.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">Segredo das Velas Baixas que Chamam Altas:</strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-zinc-300">
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800">1.01x chama 2.50x</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800">1.03x chama 2.50x-3x</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800">1.09x chama +5.00x</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800">1.11x chama 3.00x</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800">1.20x chama 8.00x</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800">1.30x chama 3.00x</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MÓDULO 5 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition">
          <button
            onClick={() => toggleSection('mod5')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                V
              </span>
              <div>
                <span className="text-sm sm:text-base font-black">Módulo 5 • Gatilhos de Ouro, Torres & Casamento de Velas</span>
                <p className="text-xs text-zinc-400 font-normal mt-0.5">1.37x (&gt;90%), Casa dos 90, Sequência de 4 Roxos e Proteção 1.49x</p>
              </div>
            </div>
            {openSection === 'mod5' ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>

          {openSection === 'mod5' && (
            <div className="p-4 sm:p-6 border-t border-zinc-800/80 bg-zinc-950/60 text-xs sm:text-sm text-zinc-300 space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-emerald-800/40 space-y-1.5">
                <strong className="text-emerald-400 block font-bold">1. Gatilho de Ouro 1.37x:</strong>
                <p className="text-xs text-zinc-300">
                  Padrão com mais de 90% de assertividade: sempre que sair o multiplicador 1.37x, faça até 5 entradas de mão fixa em busca de vela de 5x a 30x+, protegendo sempre no 1.49x!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">2. Sequência de 4 Roxos Quebrando em 1 Azul:</strong>
                <p className="text-xs text-zinc-300">
                  Um dos gatilhos favoritos da mentoria! 4 velas roxas seguidas que quebram em 1 azul. A próxima vela paga de primeira 2x a 9x+.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">3. Torre Azul (4+ Azuis):</strong>
                <p className="text-xs text-zinc-300">
                  Nunca entre durante a formação da torre! Aguarde uma vela roxa sair para quebrar a torre azul. Imediatamente após a quebra, inicie 5 entradas com proteção em 1.49x.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">4. Casamento de Decimais:</strong>
                <p className="text-xs text-zinc-300">
                  Pares casados de decimais que antecedem velas rosas: <strong>9-1, 2-5, 8-4, 3-7, 2-9, 8-1</strong>. Somas decrescentes (ex: 7 e 6) são fortíssimas para puxar rosa!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
