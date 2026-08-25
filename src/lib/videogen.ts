import { buildImageUrl } from './imagegen';

export interface VideoFrame {
  prompt: string;
  url: string;
}

export interface VideoGenResult {
  frames: VideoFrame[];
  estimatedDuration: string;
}

export function parseVideoFrames(aiResponse: string): VideoGenResult {
  try {
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('无法解析');
    const parsed = JSON.parse(match[0]);
    const frames = (parsed.frames || []).map((prompt: string) => ({
      prompt,
      url: buildImageUrl({ prompt, width: 1920, height: 1080, seed: Math.floor(Math.random() * 99999) }),
    }));
    return { frames, estimatedDuration: parsed.duration || '3-5s' };
  } catch {
    return { frames: [], estimatedDuration: '3-5s' };
  }
}

export const VIDEO_STYLES = [
  '电影级', '动画', '写实', '复古',
  '科幻', '纪录片', 'Vlog', 'MV风格',
];

export const VIDEO_DURATIONS = [
  { label: '3秒', seconds: 3 },
  { label: '5秒', seconds: 5 },
  { label: '8秒', seconds: 8 },
  { label: '12秒', seconds: 12 },
];
