// Free AI providers (no API key needed) - inspired by Hermes Agent's zero-key approach

export interface FreeProvider {
  name: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
}

export const FREE_PROVIDERS: FreeProvider[] = [
  {
    name: 'Groq (Llama 3)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    maxTokens: 2000,
  },
  {
    name: 'SambaNova',
    baseUrl: 'https://api.sambanova.ai/v1',
    model: 'Meta-Llama-3.1-8B-Instruct',
    maxTokens: 2000,
  },
  {
    name: 'Cerebras (Llama 3)',
    baseUrl: 'https://api.cerebras.ai/v1',
    model: 'llama-3.1-8b',
    maxTokens: 2000,
  },
  {
    name: 'OpenRouter (Free)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    maxTokens: 2000,
  },
];

export async function tryFreeProviders(
  messages: { role: string; content: string }[],
  onProvider?: (name: string) => void
): Promise<{ content: string; provider: string } | null> {
  for (const provider of FREE_PROVIDERS) {
    try {
      onProvider?.(provider.name);
      const res = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: provider.maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      const content = String(data?.choices?.[0]?.message?.content || '');
      if (content.length > 10) return { content, provider: provider.name };
    } catch {
      continue;
    }
  }
  return null;
}
