const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  '  "clarifyingQuestions": ["string"]\n' +
  '}\n' +
  'Si unsellable=true, mets humourMessage avec le texte, et les autres champs à des valeurs vides/zéro.\n' +
  'Si aucune question de clarification, omets le champ ou mets un tableau vide.';

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return text.trim();
}

async function callGemini(
  photos: Array<{ base64: string }>,
  memory: string | undefined,
  retryHint: boolean,
  previousAnalysis?: Record<string, unknown>,
): Promise<string> {
  const imageParts = photos.map((p) => ({
    inline_data: { mime_type: 'image/jpeg', data: p.base64 },
  }));

  let prompt = USER_PROMPT;

  if (previousAnalysis && memory?.trim()) {
    // Mode affinement : on part de l'analyse précédente et on incorpore les corrections
    prompt =
      `CONTEXTE : tu as déjà analysé cet objet et obtenu ces résultats :\n` +
      `- Nom identifié : "${previousAnalysis.name}"\n` +
      `- Catégorie : ${previousAnalysis.category}\n` +
      `- Époque : ${previousAnalysis.era}, Origine : ${previousAnalysis.origin}\n` +
      `- État : ${previousAnalysis.condition}\n` +
      `- Fourchette de prix : ${previousAnalysis.priceMin}€ – ${previousAnalysis.priceMax}€\n\n` +
      `L'utilisateur apporte maintenant cette correction/précision : "${memory.trim()}"\n\n` +
      `INSTRUCTIONS OBLIGATOIRES :\n` +
      `- Intègre DIRECTEMENT et LITTÉRALEMENT les informations fournies par l'utilisateur (nom exact, artiste, titre d'œuvre, référence, etc.) sans les remettre en question\n` +
      `- Si l'utilisateur donne un nom précis, utilise-le TEL QUEL dans le champ "name"\n` +
      `- Affine uniquement les champs impactés par la correction (prix, histoire, conseils de vente)\n` +
      `- Conserve les champs qui restent valides de l'analyse précédente\n` +
      `- NE pose JAMAIS de question sur une information que l'utilisateur vient de fournir\n` +
      `- Renvoie clarifyingQuestions vide si toutes les infos sont présentes\n\n` +
      prompt;
  } else if (memory?.trim()) {
    // Mode première précision : pas encore d'analyse précédente
    prompt =
      `L'utilisateur a fourni les précisions suivantes sur l'objet : "${memory.trim()}"\n\n` +
      `INSTRUCTIONS OBLIGATOIRES pour cette ré-estimation :\n` +
      `- Utilise ces informations pour identifier précisément l'objet (modèle exact, référence, année)\n` +
      `- Intègre DIRECTEMENT les informations fournies sans les remettre en question\n` +
      `- Affine l'estimation de prix en conséquence\n` +
      `- NE pose JAMAIS de question sur une information que l'utilisateur vient de fournir\n` +
      `- Si toutes les infos nécessaires sont présentes, renvoie clarifyingQuestions vide\n\n` +
      prompt;
  }

  if (retryHint) {
    prompt += '\nRéponds UNIQUEMENT avec du JSON valide, sans aucun texte autour.';
  }

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [...imageParts, { text: prompt }] }],
      generationConfig: { response_mime_type: 'application/json', maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT');
    const errText = await response.text().catch(() => '');
    throw new Error(`API_ERROR:${response.status}:${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { photos, memory, previousAnalysis } = await req.json();

    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: 'photos requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Premier appel
    const text = await callGemini(photos, memory, false, previousAnalysis);
    try {
      const result = JSON.parse(extractJSON(text));
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    } catch {
      // Retry si JSON invalide
      const retryText = await callGemini(photos, memory, true, previousAnalysis);
      const result = JSON.parse(extractJSON(retryText));
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === 'RATE_LIMIT' ? 429 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
