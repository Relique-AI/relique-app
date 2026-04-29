import { AnalysisResult, CapturedPhoto } from '../types';

const MODEL = 'gemini-2.5-flash';
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT =
  "Tu es l'IA d'estimation de Pépite, expert en antiquités, brocante et objets de collection. " +
  "Tu analyses des photos d'objets pour en estimer la valeur marchande et raconter " +
  "leur histoire probable de façon captivante. Réponds toujours en JSON valide uniquement, " +
  "sans texte avant ou après.";

const USER_PROMPT =
  'Analyse cet objet et retourne exactement ce JSON :\n' +
  '{\n' +
  '  "name": "string",\n' +
  '  "category": "string",\n' +
  '  "era": "string",\n' +
  '  "origin": "string",\n' +
  '  "condition": "Excellent" | "Bon" | "Correct" | "À restaurer",\n' +
  '  "conditionNote": "string",\n' +
  '  "story": "string",\n' +
  '  "priceMin": number,\n' +
  '  "priceMax": number,\n' +
  '  "priceSuggested": number,\n' +
  '  "sellingTips": ["string"]\n' +
  '}';

async function callAPI(
  photos: CapturedPhoto[],
  signal?: AbortSignal,
  retryHint = false,
): Promise<string> {
  // Construction des parties : images en premier, puis le prompt texte
  const imageParts = photos.map((photo) => ({
    inline_data: {
      mime_type: 'image/jpeg' as const,
      data: photo.base64,
    },
  }));

  const prompt = retryHint
    ? USER_PROMPT + '\nRéponds UNIQUEMENT avec du JSON valide, sans aucun texte autour.'
    : USER_PROMPT;

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            ...imageParts,
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        maxOutputTokens: 2048,
      },
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (response.status === 400) {
      const body = await response.text().catch(() => '');
      throw new Error(`400: ${body}`);
    }
    const errText = await response.text().catch(() => '');
    throw new Error(`Erreur API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  if (!text) throw new Error(`Réponse vide: ${JSON.stringify(data).slice(0, 200)}`);
  return text;
}

function extractJSON(text: string): string {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Fallback: extract first JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return text.trim();
}

export async function analyzeObject(
  photos: CapturedPhoto[],
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  const text = await callAPI(photos, signal);

  try {
    return JSON.parse(extractJSON(text)) as AnalysisResult;
  } catch {
    // Réessayer une fois avec instruction renforcée si le JSON est invalide
    const retryText = await callAPI(photos, signal, true);
    try {
      return JSON.parse(extractJSON(retryText)) as AnalysisResult;
    } catch {
      throw new Error("Impossible de parser la réponse de l'analyse");
    }
  }
}
