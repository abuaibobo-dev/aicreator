const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const BOOGU_TURBO_URL = 'https://demo-turbo.boogu.org';
const BOOGU_BASE_URL = 'https://demo-base.boogu.org';

export interface ImageGenOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
  enhance?: boolean;
}

export async function generateImage(opts: ImageGenOptions): Promise<{ url: string; provider: string }> {
  // Try Boogu-Image Turbo first (fastest, highest quality)
  try {
    const res = await fetch(`${BOOGU_TURBO_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: opts.prompt,
        width: opts.width || 1024,
        height: opts.height || 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const data = await res.json();
      const url = data.image_url || data.url || data.images?.[0];
      if (url) return { url, provider: 'Boogu-Image Turbo' };
    }
  } catch {}

  // Fallback to Boogu-Image Base
  try {
    const res = await fetch(`${BOOGU_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: opts.prompt,
        width: opts.width || 1024,
        height: opts.height || 1024,
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      const data = await res.json();
      const url = data.image_url || data.url || data.images?.[0];
      if (url) return { url, provider: 'Boogu-Image' };
    }
  } catch {}

  // Final fallback: Pollinations (always free)
  const url = buildPollinationsUrl(opts);
  return { url, provider: 'Pollinations.ai' };
}

export function buildPollinationsUrl(opts: ImageGenOptions): string {
  const prompt = encodeURIComponent(opts.prompt);
  const w = opts.width || 3840;
  const h = opts.height || 2160;
  const model = opts.model || 'flux';
  const seed = opts.seed || Math.floor(Math.random() * 999999);
  const enhance = opts.enhance !== false ? 'true' : 'false';
  return `${POLLINATIONS_BASE}/${prompt}?width=${w}&height=${h}&model=${model}&seed=${seed}&nologo=true&enhance=${enhance}`;
}

// Legacy compatibility
export function buildImageUrl(opts: ImageGenOptions): string {
  return buildPollinationsUrl(opts);
}

export const IMAGE_PRESETS = [
  { label: '4K (3840×2160)', width: 3840, height: 2160 },
  { label: '2K (2560×1440)', width: 2560, height: 1440 },
  { label: 'HD (1920×1080)', width: 1920, height: 1080 },
  { label: '竖屏 4K (2160×3840)', width: 2160, height: 3840 },
  { label: '竖屏 HD (1080×1920)', width: 1080, height: 1920 },
  { label: '方形 (2048×2048)', width: 2048, height: 2048 },
];

export const IMAGE_STYLES = [
  '写实摄影', '电影级光影', '赛博朋克', '奇幻插画',
  '水彩画', '油画', '动漫风格', '概念艺术',
  '极简主义', '超现实主义', '复古胶片', '微距摄影',
];
