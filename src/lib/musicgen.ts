const HF_API = 'https://api-inference.huggingface.co/models/facebook/musicgen-small';

export interface MusicGenOptions {
  prompt: string;
  duration?: number;
}

export async function generateMusic(opts: MusicGenOptions): Promise<Blob> {
  const res = await fetch(HF_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: opts.prompt,
      parameters: { max_new_tokens: opts.duration || 150 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `音乐生成失败（${res.status}）`);
  }
  return res.blob();
}

export const MUSIC_GENRES = [
  '电子音乐', '古典交响', '爵士乐', '摇滚',
  '民谣', '嘻哈', 'R&B', '氛围音乐',
  '中国风', '日系动漫', '电影配乐', 'Lo-Fi',
];

export const MUSIC_MOODS = [
  '激昂', '舒缓', '悲伤', '欢快',
  '神秘', '浪漫', '紧张', '史诗',
  '梦幻', '暗黑', '温暖', '空灵',
];
