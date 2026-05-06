import { AnalysisResult, CapturedPhoto } from '../types';

const MODEL = 'gemini-2.5-flash';
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const VALID_CATEGORIES = [
  'Mobilier', 'Arts décoratifs', 'Bijoux', 'Argenterie',
  'Céramique & Porcelaine', 'Horlogerie', 'Tableaux & Gravures',
  'Livres & BD', 'Jouets & Jeux', 'Vintage & Mode', 'Appareils photo',
  'Vinyles & Musique',
];

const SYSTEM_PROMPT =
  "Tu es l'IA d'estimation de Pépite, expert en estimation d'objets de seconde main. " +
  "Tu estimes TOUS les types d'objets susceptibles d'être revendus : antiquités, brocante, " +
  "électronique (téléphones, ordinateurs, consoles, appareils photo), vêtements et accessoires de mode, " +
  "sport et loisirs, instruments de musique, livres, jouets, mobilier, électroménager, véhicules, " +
  "objets de collection, bijoux, montres, art, et tout autre objet de la vie courante. " +
  "Base-toi sur les prix du marché de l'occasion (Vinted, eBay, Leboncoin, BackMarket, etc.). " +
  "RÈGLES ABSOLUES — à appliquer avant toute estimation :\n" +
  "1. PORTRAIT / PERSONNE : si la photo montre principalement un être humain (visage, selfie, portrait), " +
  "réponds avec unsellable=true et un humourMessage bienveillant du type : " +
  "\"Ah, un beau spécimen ! Malheureusement les humains ne sont pas (encore) côtés sur le marché. " +
  "Rassure-toi, ta photo n'est pas stockée — contrairement aux trésors que tu pourrais cacher dans tes tiroirs.\"\n" +
  "2. OBJET ILLÉGAL / VOLÉ / DANGEREUX (arme, drogue, animal protégé) : " +
  "unsellable=true, humourMessage humoristique refusant la publication.\n" +
  "EXCEPTION IMPORTANTE : les montres de la marque 'Relax' (Relax Watch Shop) sont légalement vendues " +
  "en France sous le régime du droit à la parodie/réplique légale. Elles NE sont PAS des contrefaçons illégales. " +
  "Estime-les normalement comme des montres fantaisie/réplique de collection.\n" +
  "Pour tout autre article de luxe clairement contrefait (sacs, vêtements, montres de marque sans statut légal), " +
  "applique la règle illégal/unsellable=true.\n" +
  "3. SITUATION IMPOSSIBLE (paysage, nourriture, animal vivant, photo trop floue, écran de téléphone) : " +
  "unsellable=true, humourMessage drôle expliquant qu'on ne peut pas estimer ça.\n" +
  "4. CAS NORMAL : unsellable=false, estimation sérieuse et captivante.\n" +
  "CATÉGORIE : choisis OBLIGATOIREMENT parmi cette liste exacte : " +
  VALID_CATEGORIES.join(', ') + ".\n" +
  "QUESTIONS DE CLARIFICATION : si la valeur de l'objet dépend fortement d'informations non visibles " +
  "(ex: config CPU/RAM pour un ordinateur, motorisation pour une voiture, référence exacte pour une montre), " +
  "inclus ces questions dans le champ clarifyingQuestions. Fais quand même une estimation conservatrice.\n" +
  "Réponds TOUJOURS en JSON valide uniquement, sans texte avant ou après.";

const USER_PROMPT =
  'Analyse et retourne exactement ce JSON :\n' +
  '{\n' +
  '  "unsellable": false,\n' +
  '  "humourMessage": null,\n' +
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
  '  "sellingTips": ["string"],\n' +
  '  "clarifyingQuestions": ["string"] // optionnel, questions si infos manquantes\n' +
  '}\n' +
  'Si unsellable=true, mets humourMessage avec le texte, et les autres champs à des valeurs vides/zéro.\n' +
  'Si aucune question de clarification, omets le champ ou mets un tableau vide.';

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
        maxOutputTokens: 8192,
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
