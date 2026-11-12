'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hi } from '@/lib/i18n/hi';
import type { Role, Step } from '@/lib/workflow/types';
import { runAiTask } from '@/lib/ai/service';
import type { AiTaskKind, AnyAiOutput } from '@/lib/ai/schemas';
import type { PromptBuildOptions } from '@/lib/ai/prompts';
import type { ApplicationRow } from '@/lib/repo/applications';

export type RequestSuggestionResult =
  | {
      ok: true;
      suggestionId: string;
      output: AnyAiOutput;
      model: string;
      latencyMs: number;
    }
  | {
      ok: false;
      error: 'AI_UNAVAILABLE' | 'UNAUTHORIZED' | 'NOT_FOUND';
      message?: string;
    };

export async function requestSuggestion(
  applicationId: string,
  _step: Step,
  kind: AiTaskKind,
  stepData?: Record<string, unknown>,
  options?: PromptBuildOptions
): Promise<RequestSuggestionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  // Load application
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !app) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  const result = await runAiTask(
    kind,
    app as ApplicationRow,
    stepData,
    user.id,
    options
  );

  if (!result.ok) {
    return { ok: false, error: 'AI_UNAVAILABLE', message: result.error };
  }

  return {
    ok: true,
    suggestionId: result.suggestionId,
    output: result.output,
    model: result.model,
    latencyMs: result.latencyMs,
  };
}

export type ResolveAction = 'DISCARD' | 'ACCEPT' | 'EDIT';

export async function resolveSuggestion(
  suggestionId: string,
  action: ResolveAction,
  finalText?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  const admin = createAdminClient();

  // Load suggestion details
  const { data: suggestion, error: fetchError } = await admin
    .from('ai_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();

  if (fetchError || !suggestion) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  const outcome =
    action === 'DISCARD'
      ? 'DISCARDED'
      : action === 'ACCEPT'
      ? 'ACCEPTED'
      : 'EDITED';

  const { error: updateError } = await admin
    .from('ai_suggestions')
    .update({
      outcome,
      final_text: finalText ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', suggestionId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // If ACCEPTED or EDITED, insert an audit_events row
  if (outcome === 'ACCEPTED' || outcome === 'EDITED') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role as Role) || null;

    const auditNote =
      outcome === 'ACCEPTED'
        ? hi.audit.aiAcceptedNote
        : hi.audit.aiEditedNote;

    await admin.from('audit_events').insert({
      application_id: suggestion.application_id,
      actor_id: user.id,
      actor_role: userRole,
      event_type: 'AI_SUGGESTION_USED',
      from_step: suggestion.step,
      to_step: suggestion.step,
      note: auditNote,
    });
  }

  revalidatePath(`/applications/${suggestion.application_id}`);
  return { ok: true };
}
