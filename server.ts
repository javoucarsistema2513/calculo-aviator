/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing large JSON payloads (screenshots can be a few megabytes)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Analyze screenshot of Aviator rounds/candles
app.post('/api/analyze-screenshot', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Chave GEMINI_API_KEY não configurada. Configure no menu Settings > Secrets.',
      });
    }

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Você é um especialista em OCR e visão computacional de jogos de Crash / Aviator (Spribe, Betano, Bet7k, Blaze, Realsbet, KTO, EstrelaBet, etc.).
Analise com extrema precisão esta imagem / print da tela do Aviator contendo o histórico de velas (multiplicadores), rodadas e horários.

Extraia todas as informações visíveis:
1. "candles": Lista ordenada de velas/multiplicadores visíveis no histórico (da mais recente para a mais antiga, ou da direita para a esquerda conforme o jogo). Para cada vela:
   - "multiplier": número float do multiplicador (ex: 1.25, 2.45, 14.80, 100.25). Se houver "x" ou "X", remova e salve como número.
   - "color": "blue" (se < 2.00x), "purple" (se entre 2.00x e 9.99x), "pink" (se entre 10.00x e 49.99x), "super" (se >= 50.00x ou 100x+).
   - "roundNumber": número ou ID da rodada se estiver visível (ex: "847291"), ou vazio se não houver.
   - "time": horário da rodada se estiver visível (ex: "14:15" ou "14:15:22"), ou vazio se não houver.
   - "firstDecimal": primeiro dígito após a vírgula/ponto (ex: para 14.80x é 8, para 2.35x é 3).
   - "decimals": os dois dígitos decimais após a vírgula/ponto como texto (ex: "80", "35").

2. "latestMultiplier": O multiplicador mais recente (última vela ocorrida). Se houver várias, pegue a mais recente.
3. "latestRoundNumber": O número da rodada mais recente visível (ou últimos dígitos). Se não visível, estime ou deixe vazio.
4. "detectedTime": O horário mais recente visível na imagem (ex: relógio do jogo, horário da vela ou relógio do celular/computador), ou deixe vazio se não houver.
5. "detectedPlatform": O nome da casa ou plataforma identificada (ex: "Bet7k", "Betano", "Blaze", "Realsbet", "KTO", "EstrelaBet", "Aviator Spribe", etc.).
6. "decimalAnalysis": Explique a subtração de decimais (|B-A| + |D-C|) entre as duas últimas velas (ex: "Velas 2.37x e 1.84x -> |3-2|=1 + |8-4|=4 = 5 minutos para Rosa").
7. "patternsFound": Lista de padrões detectados segundo as regras dos PDFs (ex: "Vela 1.00x de Reset detectada", "Vela especial 1.37x detectada", "Regra dos 13 ativa com vela +30x", "Repetição na casa dos 90").

Responda rigorosamente no schema JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latestMultiplier: { type: Type.NUMBER, description: 'Multiplicador mais recente' },
            latestRoundNumber: { type: Type.STRING, description: 'Número da rodada mais recente' },
            detectedTime: { type: Type.STRING, description: 'Horário identificado na tela (HH:MM)' },
            detectedPlatform: { type: Type.STRING, description: 'Nome da casa de aposta identificada' },
            decimalAnalysis: { type: Type.STRING, description: 'Análise da subtração de decimais' },
            patternsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Padrões e gatilhos encontrados na imagem',
            },
            candles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  multiplier: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                  roundNumber: { type: Type.STRING },
                  time: { type: Type.STRING },
                  firstDecimal: { type: Type.INTEGER },
                  decimals: { type: Type.STRING },
                },
                required: ['multiplier', 'color', 'firstDecimal', 'decimals'],
              },
            },
          },
          required: ['latestMultiplier', 'candles', 'patternsFound'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'Nenhuma resposta retornada pelo modelo Gemini.' });
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: unknown) {
    console.error('Erro ao analisar screenshot com Gemini:', error);
    const errMessage = error instanceof Error ? error.message : 'Erro ao processar imagem';
    return res.status(500).json({ error: errMessage });
  }
});

// Setup Vite or static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radar Aviator Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
