import { AnalysisResult, CapturedPhoto } from '../types';

const MODEL = 'gemini-2.5-flash';
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const VALID_CATEGORIES = [
  'Mobilier', 'Arts décoratifs', 'Bijoux', 'Argenterie',
  'Céramique & Porcelaine', 'Horlogerie', 'Tableaux & Gravures',
  'Livres & BD', 'Jouets & Jeux', 'Vintage & Mode', 'Appareils photo',
  'Vinyles & Musique', 'Informatique & Électronique', 'Téléphones & Tablettes',
  'Consoles & Jeux vidéo', 'Électroménager', 'Sport & Loisirs',
  'Instruments de musique', 'Véhicules & Accessoires', 'Divers',
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
  "IMPORTANT — AUTHENTICITÉ : tu ne peux PAS certifier ou infirmer l'authenticité d'un objet depuis une photo. " +
  "Ne jamais qualifier un objet de contrefaçon, de faux ou de réplique illégale. " +
  "Cette évaluation requiert une expertise physique que tu n'es pas en mesure de fournir. " +
  "Estime toujours l'objet tel qu'il se présente, en indiquant dans conditionNote les éventuels " +
  "doutes visuels sans jamais conclure à une fraude.\n" +
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
  memory?: string,
): Promise<string> {
  // Construction des parties : images en premier, puis le prompt texte
  const imageParts = photos.map((photo) => ({
    inline_data: {
      mime_type: 'image/jpeg' as const,
      data: photo.base64,
    },
  }));

  let prompt = USER_PROMPT;
  if (memory?.trim()) {
    prompt =
      `L'utilisateur a fourni les précisions suivantes sur l'objet : "${memory.trim()}"\n\n` +
      `INSTRUCTIONS OBLIGATOIRES pour cette ré-estimation :\n` +
      `- Utilise ces informations pour identifier précisément l'objet (modèle exact, référence, année)\n` +
      `- Recherche dans tes connaissances les caractéristiques techniques, la fiche produit et la cote de cet objet exact\n` +
      `- Affine l'estimation de prix en conséquence\n` +
      `- NE pose JAMAIS de question sur une information que l'utilisateur vient de fournir\n` +
      `- Si toutes les infos nécessaires sont présentes, renvoie clarifyingQuestions vide\n\n` +
      prompt;
  }
  if (retryHint) {
    prompt += '\nRéponds UNIQUEMENT avec du JSON valide, sans aucun texte autour.';
  }

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
  memory?: string,
): Promise<AnalysisResult> {
  const text = await callAPI(photos, signal, false, memory);

  try {
    return JSON.parse(extractJSON(text)) as AnalysisResult;
  } catch {
    const retryText = await callAPI(photos, signal, true, memory);
    try {
      return JSON.parse(extractJSON(retryText)) as AnalysisResult;
    } catch {
      throw new Error("Impossible de parser la réponse de l'analyse");
    }
  }
}
