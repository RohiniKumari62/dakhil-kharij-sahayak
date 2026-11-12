// Gemini REST API provider using fetch (no external SDK)

import type { AiProvider, GenerateJsonArgs, GenerateJsonResponse } from './provider';

export class GeminiAiProvider implements AiProvider {
  name = 'gemini';

  async generateJson(args: GenerateJsonArgs): Promise<GenerateJsonResponse> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('AI_API_KEY is not set');
    }

    const model = process.env.AI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${apiKey}`;

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: args.system }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: args.user }],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(args.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API returned empty response content');
    }

    const latencyMs = Date.now() - startTime;
    return {
      text,
      model,
      latencyMs,
    };
  }
}
