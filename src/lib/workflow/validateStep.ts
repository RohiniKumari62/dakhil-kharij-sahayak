// Validates whether data required to advance past a step is present and complete

import type { Step } from './types';

export type StepValidationErrorCode =
  | 'MISSING_DOCUMENTS_COMPLETE'
  | 'MISSING_VISIT_DATE'
  | 'MISSING_POSSESSION_STATUS'
  | 'MISSING_REPORT_TEXT'
  | 'MISSING_GENERAL_NOTICE_DATE'
  | 'MISSING_OBJECTION_DEADLINE'
  | 'MISSING_RECOMMENDATION_TEXT'
  | 'MISSING_ORDER_TEXT';

interface RawStepData {
  documentsComplete?: boolean | null;
  mismatchNotes?: string;
  officerRemarks?: string;
  visitDate?: string;
  possessionStatus?: string;
  coSharersPresent?: boolean;
  boundaryDispute?: boolean;
  roughNotes?: string;
  reportText?: string;
  generalNoticeIssuedOn?: string | null;
  objectionDeadline?: string | null;
  recommendationText?: string;
  orderText?: string;
  [key: string]: unknown;
}

/**
 * Validates that all mandatory fields for the given step are filled in.
 * Returns an array of missing field codes. An empty array indicates completeness.
 */
export function validateStepComplete(
  step: Step,
  data?: RawStepData | null
): StepValidationErrorCode[] {
  const errors: StepValidationErrorCode[] = [];
  const payload = data ?? {};

  switch (step) {
    case 'SCRUTINY': {
      if (typeof payload.documentsComplete !== 'boolean') {
        errors.push('MISSING_DOCUMENTS_COMPLETE');
      }
      break;
    }

    case 'FIELD_ENQUIRY': {
      if (!payload.visitDate || typeof payload.visitDate !== 'string' || !payload.visitDate.trim()) {
        errors.push('MISSING_VISIT_DATE');
      }
      if (!payload.possessionStatus || typeof payload.possessionStatus !== 'string' || !payload.possessionStatus.trim()) {
        errors.push('MISSING_POSSESSION_STATUS');
      }
      if (!payload.reportText || typeof payload.reportText !== 'string' || !payload.reportText.trim()) {
        errors.push('MISSING_REPORT_TEXT');
      }
      break;
    }

    case 'NOTICE_OBJECTION': {
      if (
        !payload.generalNoticeIssuedOn ||
        typeof payload.generalNoticeIssuedOn !== 'string' ||
        !payload.generalNoticeIssuedOn.trim()
      ) {
        errors.push('MISSING_GENERAL_NOTICE_DATE');
      }
      if (
        !payload.objectionDeadline ||
        typeof payload.objectionDeadline !== 'string' ||
        !payload.objectionDeadline.trim()
      ) {
        errors.push('MISSING_OBJECTION_DEADLINE');
      }
      break;
    }

    case 'HEARING_RECOMMENDATION': {
      if (
        !payload.recommendationText ||
        typeof payload.recommendationText !== 'string' ||
        !payload.recommendationText.trim()
      ) {
        errors.push('MISSING_RECOMMENDATION_TEXT');
      }
      break;
    }

    case 'FINAL_ORDER': {
      if (!payload.orderText || typeof payload.orderText !== 'string' || !payload.orderText.trim()) {
        errors.push('MISSING_ORDER_TEXT');
      }
      break;
    }

    default:
      break;
  }

  return errors;
}

