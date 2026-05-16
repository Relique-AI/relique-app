import { AnalysisResult, CapturedPhoto } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analyze-object`;

export async function analyzeObject(
  photos: CapturedPhoto[],
  signal?: AbortSignal,
  memory?: string,
  previousAnalysis?: AnalysisResult,
): Promise<AnalysisResult> {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      photos: photos.map((p) => ({ base64: p.base64 })),
      memory,
      previousAnalysis,
    }),
    signal,
  });

  if (response.status === 429) throw new Error('RATE_LIMIT');

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Erreur analyse : ${body}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  if (!data.result) throw new Error('Réponse vide');
  return data.result as AnalysisResult;
}
