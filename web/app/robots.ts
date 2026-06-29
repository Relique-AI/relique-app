import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pepite-app.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Crawlers IA — accès complet au contenu public
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'GoogleExtended', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'cohere-ai', allow: '/' },
      // Crawlers web classiques
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/profil/',
          '/profil/modifier',
          '/messages/',
          '/vendre',
          '/achat/',
          '/litige/',
          '/auth',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
