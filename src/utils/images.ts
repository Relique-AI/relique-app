const SUPABASE_STORAGE = process.env.EXPO_PUBLIC_SUPABASE_URL + '/storage/v1/object/public';
const SUPABASE_TRANSFORM = process.env.EXPO_PUBLIC_SUPABASE_URL + '/storage/v1/render/image/public';

export function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return '';
  if (!url.includes(SUPABASE_STORAGE)) return url;
  const path = url.replace(SUPABASE_STORAGE, '');
  return `${SUPABASE_TRANSFORM}${path}?width=${width}&quality=${quality}`;
}
