// Main AI service coordinating providers, prompts, Zod validation, and persistence

import { createAdminClient } from '@/lib/supabase/admin';
import type { ApplicationRow } from '@/lib/repo/applications';
import type { Step } from '@/lib/workflow/types';
import type { AiProvider } from './provider';
import { MockAiProvider } from './mockProvider';
import { GeminiAiProvider } from './geminiProvider';
import { ClaudeAiProvider } from './claudeProvider';
import { SYSTEM_PROMPT, buildUserPrompt, type PromptBuildOptions } from './prompts';
import {
  TASK_SCHEMAS,
  type AiTaskKind,
  type AnyAiOutput,
} from './schemas';

export const TASK_STEP_MAP: Record<AiTaskKind, Step> = {
  SCRUTINY_EXTRACT: 'SCRUTINY',
  FIELD_REPORT: 'FIELD_ENQUIRY',
  NOTICE_PARTIES: 'NOTICE_OBJECTION',
  HEARING_SUMMARY: 'HEARING_RECOMMENDATION',
  ORDER_DRAFT: 'FINAL_ORDER',
};

const AI_TIMEOUT_MS = 25000; // 25 second timeout

export function getAiProvider(overrideName?: string): AiProvider {
  const providerName = (overrideName || process.env.AI_PROVIDER || 'mock')
    .toLowerCase()
    .trim();

  switch (providerName) {
    case 'gemini':
      return new GeminiAiProvider();
    case 'claude':
      return new ClaudeAiProvider();
    case 'mock':
    default:
      return new MockAiProvider();
  }
}

/**
 * Strips markdown code blocks and trims whitespace from raw model output
 */
export function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export type RunAiTaskResult =
  | {
      ok: true;
      suggestionId: string;
      output: AnyAiOutput;
      model: string;
      latencyMs: number;
    }
  | {
      ok: false;
      code: 'AI_UNAVAILABLE';
      error?: string;
    };

/**
 * Runs an AI task with validation, one retry on schema failure, and logs suggestion to ai_suggestions.
 * NOTE: As per project rules, this function NEVER alters application status or current step.
 */
export async function runAiTask(
  kind: AiTaskKind,
  application: ApplicationRow,
  stepData?: Record<string, unknown>,
  userId?: string,
  options?: PromptBuildOptions & { providerOverride?: string; skipDb?: boolean }
): Promise<RunAiTaskResult> {
  const provider = getAiProvider(options?.providerOverride);
  const schema = TASK_SCHEMAS[kind];
  const initialUserPrompt = buildUserPrompt(kind, application, stepData, options);

  let validatedOutput: AnyAiOutput | null = null;
  let modelUsed = '';
  let totalLatency = 0;

  try {
    // Attempt 1
    const res1 = await provider.generateJson({
      system: SYSTEM_PROMPT,
      user: initialUserPrompt,
      timeoutMs: AI_TIMEOUT_MS,
    });

    modelUsed = res1.model;
    totalLatency = res1.latencyMs;

    try {
      const parsed1 = JSON.parse(cleanJsonText(res1.text));
      const zodCheck1 = schema.safeParse(parsed1);
      if (zodCheck1.success) {
        validatedOutput = zodCheck1.data as AnyAiOutput;
      }
    } catch {
      // JSON parse failed on first attempt; proceed to retry
    }

    // Attempt 2 (Retry once with reminder)
    if (!validatedOutput) {
      const retryPrompt = `${initialUserPrompt}\n\nREMINDER: Your previous answer was invalid or incomplete JSON. Return ONLY a single valid JSON object matching the requested schema strictly. Do not include markdown code fences or conversational text.`;

      const res2 = await provider.generateJson({
        system: SYSTEM_PROMPT,
        user: retryPrompt,
        timeoutMs: AI_TIMEOUT_MS,
      });

      modelUsed = res2.model;
      totalLatency += res2.latencyMs;

      const parsed2 = JSON.parse(cleanJsonText(res2.text));
      const zodCheck2 = schema.safeParse(parsed2);
      if (zodCheck2.success) {
        validatedOutput = zodCheck2.data as AnyAiOutput;
      }
    }

    if (!validatedOutput) {
      return { ok: false, code: 'AI_UNAVAILABLE', error: 'Output failed schema validation' };
    }

    // If skipDb is true (e.g. in unit tests), return immediately
    if (options?.skipDb) {
      return {
        ok: true,
        suggestionId: 'mock-suggestion-id',
        output: validatedOutput,
        model: modelUsed,
        latencyMs: totalLatency,
      };
    }

    // Persist suggestion into ai_suggestions table
    const admin = createAdminClient();
    const { data: inserted, error: insertError } = await admin
      .from('ai_suggestions')
      .insert({
        application_id: application.id,
        step: TASK_STEP_MAP[kind],
        kind,
        output: validatedOutput,
        provider: provider.name,
        model: modelUsed,
        latency_ms: totalLatency,
        outcome: 'PENDING',
        created_by: userId || null,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      return {
        ok: false,
        code: 'AI_UNAVAILABLE',
        error: `Failed to persist suggestion: ${insertError?.message}`,
      };
    }

    return {
      ok: true,
      suggestionId: inserted.id,
      output: validatedOutput,
      model: modelUsed,
      latencyMs: totalLatency,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AI provider error';
    return { ok: false, code: 'AI_UNAVAILABLE', error: message };
  }
}
