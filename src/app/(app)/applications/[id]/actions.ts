'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STEP_OWNER, type Role, type Step } from '@/lib/workflow/types';

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
  data: Record<string, unknown>
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

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/dashboard');

  return { ok: true };
}
