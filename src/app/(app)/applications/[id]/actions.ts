'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  STEP_OWNER,
  type Role,
  type Step,
  type Status,
  type Decision,
  type ApplicationWorkflowState,
} from '@/lib/workflow/types';
import { decide } from '@/lib/workflow/stateMachine';
import {
  validateStepComplete,
  type StepValidationErrorCode,
} from '@/lib/workflow/validateStep';

// Zod schemas for validating step payloads
const scrutinySchema = z.object({
  documentsComplete: z.boolean(),
  mismatchNotes: z.string().default(''),
  officerRemarks: z.string().default(''),
});

const fieldEnquirySchema = z.object({
  visitDate: z.string().min(1),
  possessionStatus: z.enum(['BUYER', 'SELLER', 'THIRD_PARTY', 'VACANT']),
  coSharersPresent: z.boolean().default(false),
  boundaryDispute: z.boolean().default(false),
  roughNotes: z.string().default(''),
  reportText: z.string().min(1),
});

const noticeSchema = z.object({
  generalNoticeIssuedOn: z.string().nullable().default(null),
  objectionDeadline: z.string().nullable().default(null),
  specificNoticeParties: z.array(
    z.object({
      name: z.string(),
      relation: z.string(),
    })
  ).default([]),
  objections: z.array(
    z.object({
      by: z.string(),
      text: z.string(),
      receivedOn: z.string(),
    })
  ).default([]),
});

const hearingSchema = z.object({
  hearingDate: z.string().nullable().default(null),
  summaryText: z.string().default(''),
  recommendationText: z.string().default(''),
});

const finalOrderSchema = z.object({
  orderText: z.string().default(''),
});

const STEP_SCHEMAS: Record<Step, z.ZodTypeAny> = {
  SCRUTINY: scrutinySchema,
  FIELD_ENQUIRY: fieldEnquirySchema,
  NOTICE_OBJECTION: noticeSchema,
  HEARING_RECOMMENDATION: hearingSchema,
  FINAL_ORDER: finalOrderSchema,
};

export type SaveStepResult =
  | { ok: true }
  | { ok: false; error: string; issues?: string[] };

export async function saveStepData(
  applicationId: string,
  step: Step,
  data: Record<string, unknown>,
  activeSuggestionId?: string
): Promise<SaveStepResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as Role) || null;

  // 1. Verify role ownership
  if (!userRole || STEP_OWNER[step] !== userRole) {
    return { ok: false, error: 'NOT_OWNER' };
  }

  // 2. Verify application status and step
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('status, current_step')
    .eq('id', applicationId)
    .single();

  if (appError || !app) {
    return { ok: false, error: 'CASE_CHANGED' };
  }

  if (app.status !== 'IN_PROGRESS') {
    return { ok: false, error: 'CASE_CLOSED' };
  }

  if (app.current_step !== step) {
    return { ok: false, error: 'DECISION_NOT_ALLOWED' };
  }

  // 3. Validate data shape
  const schema = STEP_SCHEMAS[step];
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'VALIDATION_FAILED',
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  // 4. Upsert into step_records via admin client
  const adminClient = createAdminClient();
  const { error: upsertError } = await adminClient.from('step_records').upsert(
    {
      application_id: applicationId,
      step,
      data: parsed.data,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'application_id,step' }
  );

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  // 5. If an active AI suggestion was applied, compare and track outcome
  if (activeSuggestionId) {
    const { data: suggestion } = await adminClient
      .from('ai_suggestions')
      .select('*')
      .eq('id', activeSuggestionId)
      .eq('application_id', applicationId)
      .single();

    if (suggestion && suggestion.outcome === 'PENDING') {
      let isUnchanged = false;
      const sugOutput = (suggestion.output as Record<string, unknown>) || {};

      if (step === 'FIELD_ENQUIRY') {
        const aiReport = ((sugOutput.reportText as string) || '').trim();
        const savedReport = ((data.reportText as string) || '').trim();
        isUnchanged = aiReport === savedReport;
      } else if (step === 'FINAL_ORDER') {
        const aiOrder = ((sugOutput.orderTextHi as string) || '').trim();
        const savedOrder = ((data.orderText as string) || '').trim();
        isUnchanged = aiOrder === savedOrder;
      } else if (step === 'HEARING_RECOMMENDATION') {
        const aiRec = ((sugOutput.draftRecommendationHi as string) || '').trim();
        const savedRec = ((data.recommendationText as string) || '').trim();
        isUnchanged = aiRec === savedRec;
      } else if (step === 'SCRUTINY') {
        const aiSummary = ((sugOutput.summaryHi as string) || '').trim();
        const savedNotes = ((data.mismatchNotes as string) || '').trim();
        isUnchanged = aiSummary === savedNotes;
      }

      const outcome = isUnchanged ? 'ACCEPTED' : 'EDITED';

      await adminClient
        .from('ai_suggestions')
        .update({
          outcome,
          final_text: JSON.stringify(data),
          resolved_at: new Date().toISOString(),
        })
        .eq('id', activeSuggestionId);

      const auditNote =
        outcome === 'ACCEPTED'
          ? 'AI सुझाव पूर्णतः स्वीकार किया गया'
          : 'AI सुझाव में संशोधन कर उपयोग किया गया';

      await adminClient.from('audit_events').insert({
        application_id: applicationId,
        actor_id: user.id,
        actor_role: userRole,
        event_type: 'AI_SUGGESTION_USED',
        from_step: step,
        to_step: step,
        note: auditNote,
      });
    }
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/dashboard');

  return { ok: true };
}

export type SubmitDecisionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      validationErrors?: StepValidationErrorCode[];
    };

export async function submitDecision(
  applicationId: string,
  decision: Decision,
  note?: string
): Promise<SubmitDecisionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as Role) || null;
  if (!userRole) {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  // 1. Load application current step and status
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id, current_step, status')
    .eq('id', applicationId)
    .single();

  if (appError || !app) {
    return { ok: false, error: 'CASE_CHANGED' };
  }

  // 2. Load step records for current step
  const { data: stepRecord } = await supabase
    .from('step_records')
    .select('data')
    .eq('application_id', applicationId)
    .eq('step', app.current_step)
    .maybeSingle();

  const currentStepData = (stepRecord?.data as Record<string, unknown>) || {};

  // 3. State machine validation
  const appState: ApplicationWorkflowState = {
    step: app.current_step as Step,
    status: app.status as Status,
  };

  const decisionResult = decide(appState, userRole, decision, note);
  if (!decisionResult.ok) {
    return { ok: false, error: decisionResult.reason };
  }

  // 4. For FORWARD, validate that step requirements are completely recorded
  if (decision === 'FORWARD') {
    const missingFields = validateStepComplete(
      app.current_step as Step,
      currentStepData
    );
    if (missingFields.length > 0) {
      return {
        ok: false,
        error: 'VALIDATION_FAILED',
        validationErrors: missingFields,
      };
    }
  }

  // 5. Invoke database transition RPC via admin client
  const adminClient = createAdminClient();
  const { error: rpcError } = await adminClient.rpc('apply_transition', {
    p_application_id: applicationId,
    p_actor_id: user.id,
    p_actor_role: userRole,
    p_event: decisionResult.event,
    p_from: decisionResult.from,
    p_to: decisionResult.to,
    p_new_status: decisionResult.newStatus,
    p_note: note || '',
  });

  if (rpcError) {
    if (rpcError.message.includes('application changed')) {
      return { ok: false, error: 'CASE_CHANGED' };
    }
    return { ok: false, error: rpcError.message };
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/dashboard');

  return { ok: true };
}
