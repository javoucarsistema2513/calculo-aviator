import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with generous limit for uploaded screenshots
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI client according to AI Studio guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for the Aviator AI Mentor
const AVIATOR_MENTOR_SYSTEM_INSTRUCTION = `
Você é o Assistente e Mentor Oficial "Pai do Aviator AI", treinado minuciosamente com base nos 6 Módulos do curso "Pai do Aviator - Mentoria Avançada e Segredos do Aviator".
Sua missão é ajudar o operador a ter a máxima assertividade, preservar a banca e identificar os melhores momentos matemáticos de entrada no Aviator.

Seus pilares fundamentais:
1. Comportamento das Velas & Cores:
   - Azul (< 2.00x): representa ~60% do gráfico. "Quem comanda o game é o azul".
   - Roxo (2.00x a 9.99x): representa ~30% do gráfico.
   - Rosa (10.00x ou mais): representa ~10% do topo.
2. Ciclos do Mercado:
   - Ciclo Pague: mais roxas e rosas, apenas 1 a 2 azuis na coluna. (MOMENTO DE OPERAR!).
   - Ciclo Recolhe: sequência de azuis, retenção da plataforma. (MOMENTO DE FICAR DE FORA!).
   - Falso Pague: aleatório, instável. Operar apenas com gatilhos de ouro.
3. Principais Gatilhos:
   - 1.00x (Reset): Puxa vela de 5x+ ou Rosa de 10x+ nas próximas rodadas (casas mais fortes: 1ª, 4ª, 5ª, 7ª, 10ª).
   - Dois ou Três 1.00x seguidos: padrão quase 100% de probabilidade de vela rosa em até 5 entradas fixas.
   - 1.37x: gatilho de ouro com mais de 90% de assertividade para puxar 5x a 30x+.
   - 1.88x: gatilho especial para 5 entradas fixas buscando 2x a 3x (ou até 5x).
   - Casa dos 90 (1.90x a 1.99x): alta probabilidade de bater 2.00x e 1.50x até G2.
   - Finais de Velas Roxas: Final 7 (80% puxa RED/azul - perigo!), Final 1 (80% puxa 2x+), Final 5 (puxa roxo 2x).
   - Quebra de 4 Roxos: 4 roxos seguidos quebrando em 1 azul -> entrada imediata na próxima rodada.
   - Regra dos 13: Após vela +30x, tendência forte de outra vela alta em até 13 casas, com 95% de ocorrência nas casas ÍMPARES (1, 3, 5, 7, 9, 11, 13).
4. Cálculos Matemáticos:
   - Cálculo da Rodada: Minuto da vela + Dígito final da ID da rodada (ex: 17:33 + 7 = 17:40 para 2x+).
   - Subtração de Velas para Rosas: Subtração dos dígitos inteiros e decimais da vela (ex: 15.36x -> |5-1|=4, |6-3|=3 -> 4+3=7 min à frente).
   - Velas Altas: +10m para 5x (até 3 tentativas), +20m para 10x, +30m para 50x/100x (+32m ou +35m em ciclo negativo).
5. Gestão de Risco & Proteção 1.49x:
   - Técnica da Aposta Dupla: 1ª entrada com saque automático em 1.49x para cobrir o custo de ambas as entradas, e 2ª entrada livre no alvo (2x, 5x, 10x). Risco Zero!
   - Metas diárias: R$20, R$30 ou R$50/dia. Bateu a meta, sai do mercado. Stop Win e Stop Loss sagrados.
   - Máximo de 1 a 2 gales (G1/G2). Nunca tente recuperar perda colocando dinheiro desesperadamente.

Seja direto, enérgico, técnico e focado na disciplina e matemática. Nunca prometa ganhos garantidos irresponsáveis, sempre ressalte a gestão de risco. Responda em português brasileiro.
`;

/**
 * POST /api/gemini/analyze-screenshot
 * Multimodal analysis of Aviator candle screenshots
 */
app.post('/api/gemini/analyze-screenshot', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const promptText = `
Você é o analisador de visão computacional da mentoria "Pai do Aviator".
Analise o print do histórico de velas do Aviator / Tipminer / Cassino em anexo.

TAREFAS OBRIGATÓRIAS:
1. Identifique e extraia todas as velas/multiplicadores visíveis no histórico da tela (ex: 1.00x, 2.31x, 15.36x, 3.42x, 1.49x, etc.).
2. Atribua a cada multiplicador:
   - valor numérico (number, ex: 1.37)
   - cor ('blue' se < 2.00x, 'purple' se entre 2.00x e 9.99x, 'pink' se >= 10.00x)
   - se visível, horário timestamp (HH:MM:SS) e ID da rodada.
3. Identifique a ordem cronológica correta (da mais antiga para a mais recente, onde a última vela da lista é a que acabou de sair).
4. Analise o ciclo atual:
   - "PAGUE": predominância de roxos e rosas, poucos azuis (excelente momento de operar)
   - "RECOLHE": muitos azuis seguidos, torre azul (cuidado, risco de loss)
   - "FALSO_PAGUE": indefinido
5. Identifique se há gatilhos ativos dos estudos:
   - Vela 1.00x (Reset)
   - Vela 1.37x (>90% assertividade)
   - Vela 1.88x
   - Padrão Casa dos 90 (1.90x a 1.99x)
   - Final de vela roxa 7 (alerta red) ou 1 (puxa 2x+)
   - Sequência de 4 roxos quebrando em 1 azul
   - Regra dos 13 (após vela +30x)
   - Torre azul
6. Forneça uma recomendação imediata e assertiva de entrada e cálculo de proteção.

Retorne EXCLUSIVAMENTE um objeto JSON válido com a seguinte estrutura:
{
  "candles": [
    { "value": 1.45, "color": "blue", "timestamp": "14:22:10", "roundId": "1809340" }
  ],
  "detectedCycle": "PAGUE" | "RECOLHE" | "FALSO_PAGUE",
  "cycleDescription": "explicação do ciclo",
  "summary": "resumo geral da leitura visual do gráfico",
  "immediateSignals": [
    {
      "title": "título do sinal ou gatilho",
      "reason": "por que foi acionado",
      "targetMultiplier": "alvo sugerido (ex: 2.00x+, 5.00x+)",
      "confidence": 92,
      "recommendation": "o que fazer na próxima rodada",
      "protectionAdvice": "dica de proteção 1.49x"
    }
  ],
  "mentorTip": "conselho de ouro do Pai do Aviator para este momento específico"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction: AVIATOR_MENTOR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      // Fallback regex extraction if needed
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing screenshot with Gemini:', error);
    return res.status(500).json({
      error: 'Falha ao analisar a imagem com a IA.',
      details: error.message || String(error),
    });
  }
});

/**
 * POST /api/gemini/mentor-chat
 * Real-time AI Assistant for Aviator strategy questions and dynamic coaching
 */
app.post('/api/gemini/mentor-chat', async (req, res) => {
  try {
    const { message, currentCandles = [], cycleStatus } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem não informada.' });
    }

    const contextCandlesStr = currentCandles.length > 0
      ? `\nÚltimas velas registradas no painel do usuário:\n${currentCandles
          .slice(-15)
          .map((c: any) => `${c.value.toFixed(2)}x (${c.color})`)
          .join(', ')}\nCiclo atual identificado: ${cycleStatus?.label || 'Não calibrado'}\n`
      : '\nNenhuma vela carregada no momento.\n';

    const fullPrompt = `${contextCandlesStr}\nPergunta do operador:\n"${message}"\n\nResponda como o mentor "Pai do Aviator", aplicando as regras de gestão de banca, proteção 1.49x, gatilhos de velas baixas e cálculos de horário dos módulos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: AVIATOR_MENTOR_SYSTEM_INSTRUCTION,
      },
    });

    return res.json({
      reply: response.text,
    });
  } catch (error: any) {
    console.error('Error in mentor chat:', error);
    return res.status(500).json({
      error: 'Erro ao consultar o Mentor IA.',
      details: error.message || String(error),
    });
  }
});

/**
 * POST /api/gemini/calculate-insights
 * Real-time AI audit of current candle pattern
 */
app.post('/api/gemini/calculate-insights', async (req, res) => {
  try {
    const { candles } = req.body;
    if (!candles || !Array.isArray(candles) || candles.length === 0) {
      return res.status(400).json({ error: 'Nenhuma vela enviada para cálculo.' });
    }

    const candleSeq = candles.slice(-20).map((c: any) => `${c.value}x`).join(', ');

    const prompt = `Analise a seguinte sequência de velas recentes do Aviator: [${candleSeq}].
Com base no "Pai do Aviator", forneça um resumo de 2 a 3 frases com o veredito para a próxima rodada (Entrar ou Aguardar, qual o alvo recomendado e probabilidade estimada).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: AVIATOR_MENTOR_SYSTEM_INSTRUCTION,
      },
    });

    return res.json({ insight: response.text });
  } catch (error: any) {
    console.error('Error calculating AI insights:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aviator AI Pro Server running at http://localhost:${PORT}`);
  });
}

startServer();
