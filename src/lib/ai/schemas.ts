// Zod schemas for AI task structured JSON responses

import { z } from 'zod';

export type AiTaskKind =
  | 'SCRUTINY_EXTRACT'
  | 'FIELD_REPORT'
  | 'NOTICE_PARTIES'
  | 'HEARING_SUMMARY'
  | 'ORDER_DRAFT';

export const scrutinyExtractSchema = z.object({
  extracted: z.object({
    sellerName: z.string(),
    buyerName: z.string(),
    khataNo: z.string(),
    khesraNo: z.string(),
    areaDecimal: z.number().nullable(),
    deedNo: z.string(),
    deedDate: z.string().nullable(),
    boundaryDescription: z.string(),
  }),
  mismatches: z.array(
    z.object({
      field: z.string(),
      petitionValue: z.string(),
      deedValue: z.string(),
      severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      explanationHi: z.string(),
    })
  ),
  missingItems: z.array(z.string()),
  summaryHi: z.string(),
});

export type ScrutinyExtractOutput = z.infer<typeof scrutinyExtractSchema>;

export const fieldReportSchema = z.object({
  reportText: z.string(),
  possessionStatus: z.enum([
    'BUYER',
    'SELLER',
    'THIRD_PARTY',
    'VACANT',
    'UNKNOWN',
  ]),
  coSharersMentioned: z.array(z.string()),
  boundaryDispute: z.boolean().nullable(),
  missingItems: z.array(z.string()),
});

export type FieldReportOutput = z.infer<typeof fieldReportSchema>;

export const noticePartiesSchema = z.object({
  parties: z.array(
    z.object({
      name: z.string(),
      relation: z.string(),
      reasonHi: z.string(),
      source: z.enum(['DEED', 'FIELD_REPORT']),
    })
  ),
  uncertainNotes: z.array(z.string()),
});

export type NoticePartiesOutput = z.infer<typeof noticePartiesSchema>;

export const hearingSummarySchema = z.object({
  summaryHi: z.string(),
  keyRisks: z.array(
    z.object({
      titleHi: z.string(),
      whyHi: z.string(),
      evidence: z.string(),
    })
  ),
  pointsFor: z.array(z.string()),
  pointsAgainst: z.array(z.string()),
  draftRecommendationHi: z.string(),
});

export type HearingSummaryOutput = z.infer<typeof hearingSummarySchema>;

export const orderDraftSchema = z.object({
  orderTextHi: z.string(),
  missingFacts: z.array(z.string()),
});

export type OrderDraftOutput = z.infer<typeof orderDraftSchema>;

export type AnyAiOutput =
  | ScrutinyExtractOutput
  | FieldReportOutput
  | NoticePartiesOutput
  | HearingSummaryOutput
  | OrderDraftOutput;

export const TASK_SCHEMAS: Record<AiTaskKind, z.ZodTypeAny> = {
  SCRUTINY_EXTRACT: scrutinyExtractSchema,
  FIELD_REPORT: fieldReportSchema,
  NOTICE_PARTIES: noticePartiesSchema,
  HEARING_SUMMARY: hearingSummarySchema,
  ORDER_DRAFT: orderDraftSchema,
};
