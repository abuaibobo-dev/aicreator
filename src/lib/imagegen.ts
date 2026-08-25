const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

export interface ImageGenOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
  enhance?: boolean;
}

export function buildImageUrl(opts: ImageGenOptions): string {
  const prompt = encodeURIComponent(opts.prompt);
  const w = opts.width || 3840;
  const h = opts.height || 2160;
  const model = opts.model || 'flux';
  const seed = opts.seed || Math.floor(Math.random() * 999999);
  const enhance = opts.enhance !== false ? 'true' : 'false';
  return `${POLLINATIONS_BASE}/${prompt}?width=${w}&height=${h}&model=${model}&seed=${seed}&nologo=true&enhance=${enhance}`;
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
