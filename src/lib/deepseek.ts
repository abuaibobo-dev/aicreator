import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryFreeProviders } from './freeProviders';

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT: Settings = { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' };

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem('aicreator.settings');
  return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
}

export async function saveSettings(s: Partial<Settings>) {
  const cur = await getSettings();
  await AsyncStorage.setItem('aicreator.settings', JSON.stringify({ ...cur, ...s }));
}

async function callDeepSeekAPI(
  messages: { role: string; content: string }[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const s = await getSettings();
  if (!s.apiKey) throw new Error('NO_KEY');
  const res = await fetch(`${s.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.apiKey}` },
    body: JSON.stringify({
      model: s.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2000,
      stream: false,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || `请求失败（${res.status}）`);
  return String(data?.choices?.[0]?.message?.content || '');
}

export async function callDeepSeek(
  messages: { role: string; content: string }[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  try {
    return await callDeepSeekAPI(messages, opts);
  } catch (e: any) {
    if (e.message === 'NO_KEY' || e.message.includes('401') || e.message.includes('403')) {
      const free = await tryFreeProviders(messages);
      if (free) return free.content;
    }
    throw e;
  }
}

export async function optimizePrompt(userInput: string, type: 'image' | 'video' | 'music'): Promise<string> {
  const systemMap: Record<string, string> = {
    image: '你是专业AI绘图提示词工程师。将用户简单描述转换成高质量的英文绘图提示词（Stable Diffusion/Flux风格）。要求：1.包含主体、环境、光线、构图、风格等细节；2.用英文输出；3.直接输出提示词，不要解释。质量关键词如：8k, ultra detailed, masterpiece, best quality。',
    video: '你是专业视频分镜师。将用户描述转换成4-8个连续镜头的英文提示词。每个镜头描述一个关键帧。输出JSON格式：{"frames":["prompt1","prompt2",...],"duration":"3-5s"}',
    music: '你是专业音乐制作人。将用户描述转换成英文音乐生成提示词。输出JSON格式：{"prompt":"detailed music description","genre":"genre","bpm":120,"mood":"emotional mood"}',
  };
  const content = await callDeepSeek([
    { role: 'system', content: systemMap[type] },
    { role: 'user', content: userInput },
  ], { temperature: 0.6, maxTokens: 800 });
  return content;
}

export async function chatWithAI(
  history: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt?: string
): Promise<{ content: string; provider: string }> {
  const s = await getSettings();
  const messages = [
    { role: 'system', content: systemPrompt || '你是一个智能助手，可以聊天、回答问题、提供创意建议。用中文回复。' },
    ...history.slice(-20),
  ];
  
  if (s.apiKey) {
    try {
      const content = await callDeepSeekAPI(messages);
      return { content, provider: `DeepSeek (${s.model})` };
    } catch (e: any) {
      if (e.message === 'NO_KEY' || e.message.includes('401')) {
        const free = await tryFreeProviders(messages);
        if (free) return { content: free.content, provider: free.provider };
      }
      throw e;
    }
  }
  
  const free = await tryFreeProviders(messages);
  if (free) return { content: free.content, provider: free.provider };
  throw new Error('请在设置中配置 API Key，或检查网络连接');
}
