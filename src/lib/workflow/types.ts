// Core workflow domain types aligned with Supabase schema enums

export type Role = 'halka_karamchari' | 'revenue_officer' | 'circle_officer';

export type Step =
  | 'SCRUTINY'
  | 'FIELD_ENQUIRY'
  | 'NOTICE_OBJECTION'
  | 'HEARING_RECOMMENDATION'
  | 'FINAL_ORDER';

export type Status =
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED_TO_APPLICANT';

export type Decision = 'FORWARD' | 'RETURN' | 'APPROVE' | 'REJECT';

export type AiOutcome = 'PENDING' | 'ACCEPTED' | 'EDITED' | 'DISCARDED';

export const STEP_ORDER: readonly Step[] = [
  'SCRUTINY',
  'FIELD_ENQUIRY',
  'NOTICE_OBJECTION',
  'HEARING_RECOMMENDATION',
  'FINAL_ORDER',
] as const;

export const STEP_OWNER: Record<Step, Role> = {
  SCRUTINY: 'revenue_officer',
  FIELD_ENQUIRY: 'halka_karamchari',
  NOTICE_OBJECTION: 'revenue_officer',
  HEARING_RECOMMENDATION: 'revenue_officer',
  FINAL_ORDER: 'circle_officer',
} as const;

// Step-specific payload schemas
export interface ScrutinyData {
  documentsComplete: boolean;
  mismatchNotes: string;
  officerRemarks: string;
}

export type PossessionStatus = 'BUYER' | 'SELLER' | 'THIRD_PARTY' | 'VACANT';

export interface FieldEnquiryData {
  visitDate: string;
  possessionStatus: PossessionStatus;
  coSharersPresent: boolean;
  boundaryDispute: boolean;
  roughNotes: string;
  reportText: string;
}

export interface NoticeParty {
  name: string;
  relation: string;
}

export interface Objection {
  by: string;
  text: string;
  receivedOn: string;
}

export interface NoticeData {
  generalNoticeIssuedOn: string | null;
  specificNoticeParties: NoticeParty[];
  objectionDeadline: string | null;
  objections: Objection[];
}

export interface HearingData {
  hearingDate: string | null;
  summaryText: string;
  recommendationText: string;
}

export interface FinalOrderData {
  orderText: string;
}

export type AnyStepData =
  | ScrutinyData
  | FieldEnquiryData
  | NoticeData
  | HearingData
  | FinalOrderData;

export type StateMachineReason =
  | 'NOT_OWNER'
  | 'CASE_CLOSED'
  | 'DECISION_NOT_ALLOWED'
  | 'NOTE_REQUIRED';

export interface ApplicationWorkflowState {
  step: Step;
  status: Status;
}

export type DecideResult =
  | {
      ok: true;
      event: 'FORWARDED' | 'RETURNED' | 'APPROVED' | 'REJECTED' | 'RETURNED_TO_APPLICANT';
      from: Step;
      to: Step;
      newStatus: Status;
    }
  | {
      ok: false;
      reason: StateMachineReason;
    };

