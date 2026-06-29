import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pepite-app.com';

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

function priority(route: string): number {
  if (route === '/') return 1.0;
  if (route === '/estimer') return 0.9;
  if (route.startsWith('/estimer/')) return 0.85;
  if (route === '/market') return 0.8;
  if (route === '/telecharger') return 0.8;
  if (route.startsWith('/legal/')) return 0.3;
  return 0.5;
}

function changeFreq(route: string): ChangeFreq {
  if (route === '/market') return 'daily';
  if (route.startsWith('/legal/')) return 'yearly';
  if (route.startsWith('/estimer')) return 'monthly';
  return 'weekly';
}

function scanPages(dir: string, routeBase = ''): { route: string; lastMod: Date }[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const result: { route: string; lastMod: Date }[] = [];

  for (const entry of entries) {
    // Skip dynamic segments ([id]), private (_), route groups ((...)), api routes
    if (
      entry.name.startsWith('[') ||
      entry.name.startsWith('_') ||
      entry.name.startsWith('(') ||
      entry.name === 'api'
    ) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...scanPages(fullPath, `${routeBase}/${entry.name}`));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      result.push({
        route: routeBase || '/',
        lastMod: statSync(fullPath).mtime,
      });
    }
  }

  return result;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = join(process.cwd(), 'app');
  const pages = scanPages(appDir);

  return pages.map(({ route, lastMod }) => ({
    url: `${BASE_URL}${route}`,
    lastModified: lastMod,
    changeFrequency: changeFreq(route),
    priority: priority(route),
  }));
}
