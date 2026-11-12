// Claude REST API provider using fetch (no external SDK)

import type { AiProvider, GenerateJsonArgs, GenerateJsonResponse } from './provider';

export class ClaudeAiProvider implements AiProvider {
  name = 'claude';

  async generateJson(args: GenerateJsonArgs): Promise<GenerateJsonResponse> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('AI_API_KEY is not set');
    }

    const model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';
    const endpoint = 'https://api.anthropic.com/v1/messages';

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: args.system,
        messages: [
          {
            role: 'user',
            content: args.user,
          },
        ],
      }),
      signal: AbortSignal.timeout(args.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) {
      throw new Error('Claude API returned empty content');
    }

    const latencyMs = Date.now() - startTime;
    return {
      text,
      model,
      latencyMs,
    };
  }
}
