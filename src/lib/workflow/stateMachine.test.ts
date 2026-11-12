import { describe, expect, it } from 'vitest';
import { availableDecisions, decide } from './stateMachine';
import { validateStepComplete } from './validateStep';
import {
  addWorkingDays,
  dueDate,
  isBeyondLimit,
  registrationDelayDays,
  urgency,
  workingDaysBetween,
} from './sla';
import type { ApplicationWorkflowState } from './types';

describe('Workflow State Machine', () => {
  describe('availableDecisions', () => {
    it('returns empty array when application is closed', () => {
      const closedApproved: ApplicationWorkflowState = { step: 'FINAL_ORDER', status: 'APPROVED' };
      const closedRejected: ApplicationWorkflowState = { step: 'SCRUTINY', status: 'REJECTED' };
      const closedReturned: ApplicationWorkflowState = { step: 'SCRUTINY', status: 'RETURNED_TO_APPLICANT' };

      expect(availableDecisions(closedApproved, 'circle_officer')).toEqual([]);
      expect(availableDecisions(closedRejected, 'revenue_officer')).toEqual([]);
      expect(availableDecisions(closedReturned, 'revenue_officer')).toEqual([]);
    });

    it('returns empty array when role is not the step owner', () => {
      const app: ApplicationWorkflowState = { step: 'SCRUTINY', status: 'IN_PROGRESS' };
      expect(availableDecisions(app, 'halka_karamchari')).toEqual([]);
      expect(availableDecisions(app, 'circle_officer')).toEqual([]);
    });

    it('returns allowed decisions for each step for the rightful owner', () => {
      expect(availableDecisions({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer'))
        .toEqual(['FORWARD', 'RETURN', 'REJECT']);

      expect(availableDecisions({ step: 'FIELD_ENQUIRY', status: 'IN_PROGRESS' }, 'halka_karamchari'))
        .toEqual(['FORWARD', 'RETURN']);

      expect(availableDecisions({ step: 'NOTICE_OBJECTION', status: 'IN_PROGRESS' }, 'revenue_officer'))
        .toEqual(['FORWARD', 'RETURN']);

      expect(availableDecisions({ step: 'HEARING_RECOMMENDATION', status: 'IN_PROGRESS' }, 'revenue_officer'))
        .toEqual(['FORWARD', 'RETURN']);

      expect(availableDecisions({ step: 'FINAL_ORDER', status: 'IN_PROGRESS' }, 'circle_officer'))
        .toEqual(['APPROVE', 'REJECT', 'RETURN']);
    });
  });

  describe('decide - Legal Moves', () => {
    it('FORWARD transitions sequentially from SCRUTINY to FINAL_ORDER', () => {
      // Step 1 -> 2
      const res1 = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer', 'FORWARD');
      expect(res1).toEqual({
        ok: true,
        event: 'FORWARDED',
        from: 'SCRUTINY',
        to: 'FIELD_ENQUIRY',
        newStatus: 'IN_PROGRESS',
      });

      // Step 2 -> 3
      const res2 = decide({ step: 'FIELD_ENQUIRY', status: 'IN_PROGRESS' }, 'halka_karamchari', 'FORWARD');
      expect(res2).toEqual({
        ok: true,
        event: 'FORWARDED',
        from: 'FIELD_ENQUIRY',
        to: 'NOTICE_OBJECTION',
        newStatus: 'IN_PROGRESS',
      });

      // Step 3 -> 4
      const res3 = decide({ step: 'NOTICE_OBJECTION', status: 'IN_PROGRESS' }, 'revenue_officer', 'FORWARD');
      expect(res3).toEqual({
        ok: true,
        event: 'FORWARDED',
        from: 'NOTICE_OBJECTION',
        to: 'HEARING_RECOMMENDATION',
        newStatus: 'IN_PROGRESS',
      });

      // Step 4 -> 5
      const res4 = decide({ step: 'HEARING_RECOMMENDATION', status: 'IN_PROGRESS' }, 'revenue_officer', 'FORWARD');
      expect(res4).toEqual({
        ok: true,
        event: 'FORWARDED',
        from: 'HEARING_RECOMMENDATION',
        to: 'FINAL_ORDER',
        newStatus: 'IN_PROGRESS',
      });
    });

    it('RETURN at steps 2 through 5 moves back one step with valid note', () => {
      const validNote = 'कागजात में त्रुटि पाई गई है, पुनः सत्यापन करें।';

      const resFinal = decide({ step: 'FINAL_ORDER', status: 'IN_PROGRESS' }, 'circle_officer', 'RETURN', validNote);
      expect(resFinal).toEqual({
        ok: true,
        event: 'RETURNED',
        from: 'FINAL_ORDER',
        to: 'HEARING_RECOMMENDATION',
        newStatus: 'IN_PROGRESS',
      });

      const resField = decide({ step: 'FIELD_ENQUIRY', status: 'IN_PROGRESS' }, 'halka_karamchari', 'RETURN', validNote);
      expect(resField).toEqual({
        ok: true,
        event: 'RETURNED',
        from: 'FIELD_ENQUIRY',
        to: 'SCRUTINY',
        newStatus: 'IN_PROGRESS',
      });
    });

    it('RETURN at SCRUTINY sets status to RETURNED_TO_APPLICANT', () => {
      const validNote = 'आवेदन पत्र के साथ खतियान संलग्न नहीं है।';
      const res = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer', 'RETURN', validNote);
      expect(res).toEqual({
        ok: true,
        event: 'RETURNED_TO_APPLICANT',
        from: 'SCRUTINY',
        to: 'SCRUTINY',
        newStatus: 'RETURNED_TO_APPLICANT',
      });
    });

    it('APPROVE is permitted at FINAL_ORDER by circle_officer', () => {
      const res = decide({ step: 'FINAL_ORDER', status: 'IN_PROGRESS' }, 'circle_officer', 'APPROVE');
      expect(res).toEqual({
        ok: true,
        event: 'APPROVED',
        from: 'FINAL_ORDER',
        to: 'FINAL_ORDER',
        newStatus: 'APPROVED',
      });
    });

    it('REJECT is permitted at SCRUTINY and FINAL_ORDER with valid note', () => {
      const validNote = 'भूमि पर पूर्व से विवाद लंबित होने के कारण अस्वीकृत।';

      const res1 = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer', 'REJECT', validNote);
      expect(res1).toEqual({
        ok: true,
        event: 'REJECTED',
        from: 'SCRUTINY',
        to: 'SCRUTINY',
        newStatus: 'REJECTED',
      });

      const res5 = decide({ step: 'FINAL_ORDER', status: 'IN_PROGRESS' }, 'circle_officer', 'REJECT', validNote);
      expect(res5).toEqual({
        ok: true,
        event: 'REJECTED',
        from: 'FINAL_ORDER',
        to: 'FINAL_ORDER',
        newStatus: 'REJECTED',
      });
    });
  });

  describe('decide - Illegal Moves & Error Codes', () => {
    it('rejects wrong role with NOT_OWNER', () => {
      const res = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'halka_karamchari', 'FORWARD');
      expect(res).toEqual({ ok: false, reason: 'NOT_OWNER' });
    });

    it('rejects closed cases with CASE_CLOSED', () => {
      const res = decide({ step: 'FINAL_ORDER', status: 'APPROVED' }, 'circle_officer', 'RETURN', 'valid note here');
      expect(res).toEqual({ ok: false, reason: 'CASE_CLOSED' });
    });

    it('rejects APPROVE before final step with DECISION_NOT_ALLOWED', () => {
      const res = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer', 'APPROVE');
      expect(res).toEqual({ ok: false, reason: 'DECISION_NOT_ALLOWED' });
    });

    it('rejects FORWARD at FINAL_ORDER with DECISION_NOT_ALLOWED', () => {
      const res = decide({ step: 'FINAL_ORDER', status: 'IN_PROGRESS' }, 'circle_officer', 'FORWARD');
      expect(res).toEqual({ ok: false, reason: 'DECISION_NOT_ALLOWED' });
    });

    it('rejects REJECT at intermediate steps with DECISION_NOT_ALLOWED', () => {
      const note = 'मान्य कारण का विवरण दस अक्षरों से बड़ा है';
      const res = decide({ step: 'FIELD_ENQUIRY', status: 'IN_PROGRESS' }, 'halka_karamchari', 'REJECT', note);
      expect(res).toEqual({ ok: false, reason: 'DECISION_NOT_ALLOWED' });
    });

    it('rejects RETURN without note with NOTE_REQUIRED', () => {
      const res = decide({ step: 'FIELD_ENQUIRY', status: 'IN_PROGRESS' }, 'halka_karamchari', 'RETURN');
      expect(res).toEqual({ ok: false, reason: 'NOTE_REQUIRED' });
    });

    it('rejects RETURN with note shorter than 10 characters with NOTE_REQUIRED', () => {
      const res = decide({ step: 'FIELD_ENQUIRY', status: 'IN_PROGRESS' }, 'halka_karamchari', 'RETURN', 'Short');
      expect(res).toEqual({ ok: false, reason: 'NOTE_REQUIRED' });
    });

    it('rejects REJECT without note or note shorter than 10 chars with NOTE_REQUIRED', () => {
      const resNoNote = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer', 'REJECT');
      expect(resNoNote).toEqual({ ok: false, reason: 'NOTE_REQUIRED' });

      const resShort = decide({ step: 'SCRUTINY', status: 'IN_PROGRESS' }, 'revenue_officer', 'REJECT', 'कम शब्द');
      expect(resShort).toEqual({ ok: false, reason: 'NOTE_REQUIRED' });
    });
  });
});

describe('Step Validation (validateStepComplete)', () => {
  it('validates SCRUTINY data', () => {
    expect(validateStepComplete('SCRUTINY', {})).toContain('MISSING_DOCUMENTS_COMPLETE');
    expect(validateStepComplete('SCRUTINY', { documentsComplete: false })).toEqual([]);
    expect(validateStepComplete('SCRUTINY', { documentsComplete: true })).toEqual([]);
  });

  it('validates FIELD_ENQUIRY data', () => {
    const emptyErrors = validateStepComplete('FIELD_ENQUIRY', {});
    expect(emptyErrors).toContain('MISSING_VISIT_DATE');
    expect(emptyErrors).toContain('MISSING_POSSESSION_STATUS');
    expect(emptyErrors).toContain('MISSING_REPORT_TEXT');

    const validErrors = validateStepComplete('FIELD_ENQUIRY', {
      visitDate: '2026-05-10',
      possessionStatus: 'BUYER',
      reportText: 'स्थल निरीक्षण पूर्ण हुआ।',
    });
    expect(validErrors).toEqual([]);
  });

  it('validates NOTICE_OBJECTION data', () => {
    const emptyErrors = validateStepComplete('NOTICE_OBJECTION', {});
    expect(emptyErrors).toContain('MISSING_GENERAL_NOTICE_DATE');
    expect(emptyErrors).toContain('MISSING_OBJECTION_DEADLINE');

    const validErrors = validateStepComplete('NOTICE_OBJECTION', {
      generalNoticeIssuedOn: '2026-05-12',
      objectionDeadline: '2026-05-27',
    });
    expect(validErrors).toEqual([]);
  });

  it('validates HEARING_RECOMMENDATION data', () => {
    expect(validateStepComplete('HEARING_RECOMMENDATION', {})).toContain('MISSING_RECOMMENDATION_TEXT');
    expect(
      validateStepComplete('HEARING_RECOMMENDATION', { recommendationText: 'दाखिल खारिज की अनुशंसा की जाती है।' })
    ).toEqual([]);
  });

  it('validates FINAL_ORDER data', () => {
    expect(validateStepComplete('FINAL_ORDER', {})).toContain('MISSING_ORDER_TEXT');
    expect(validateStepComplete('FINAL_ORDER', { orderText: 'दाखिल खारिज स्वीकृत किया जाता है।' })).toEqual([]);
  });
});

describe('SLA and Deadline Calculations', () => {
  it('adds working days correctly, skipping weekends', () => {
    // 2026-05-08 is Friday. Adding 1 working day should land on Monday 2026-05-11.
    expect(addWorkingDays('2026-05-08', 1)).toBe('2026-05-11');
    // Adding 5 working days to Monday 2026-05-04 should be Monday 2026-05-11.
    expect(addWorkingDays('2026-05-04', 5)).toBe('2026-05-11');
  });

  it('handles leap year calculations correctly', () => {
    // 2024 is a leap year (February has 29 days).
    // 2024-02-28 is Wednesday. 1 working day -> 2024-02-29. 2 working days -> 2024-03-01.
    expect(addWorkingDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addWorkingDays('2024-02-28', 2)).toBe('2024-03-01');
  });

  it('calculates dueDate based on slaDays', () => {
    const due = dueDate('2026-06-01', 30);
    expect(due).toBeDefined();
    expect(typeof due).toBe('string');
  });

  it('calculates workingDaysBetween', () => {
    // Mon to Fri same week = 4 working days difference
    expect(workingDaysBetween('2026-05-04', '2026-05-08')).toBe(4);
    // Friday to Monday across weekend = 1 working day difference
    expect(workingDaysBetween('2026-05-08', '2026-05-11')).toBe(1);
    // Past date (due was yesterday)
    expect(workingDaysBetween('2026-05-11', '2026-05-08')).toBe(-1);
  });

  it('calculates urgency tiers', () => {
    // Past due date
    const overdueRes = urgency('2026-05-01', '2026-05-05');
    expect(overdueRes.level).toBe('OVERDUE');
    expect(overdueRes.daysLeft).toBeLessThan(0);

    // Due in 3 working days (within 5 working days)
    const dueSoonRes = urgency('2026-05-07', '2026-05-04');
    expect(dueSoonRes.level).toBe('DUE_SOON');
    expect(dueSoonRes.daysLeft).toBe(3);

    // Due in 10 working days
    const onTrackRes = urgency('2026-05-18', '2026-05-04');
    expect(onTrackRes.level).toBe('ON_TRACK');
    expect(onTrackRes.daysLeft).toBe(10);
  });

  it('calculates registrationDelayDays and isBeyondLimit', () => {
    // 80 days delay -> not beyond limit
    const delay80 = registrationDelayDays('2026-01-01', '2026-03-22');
    expect(delay80).toBe(80);
    expect(isBeyondLimit(delay80)).toBe(false);

    // 95 days delay -> beyond limit
    const delay95 = registrationDelayDays('2026-01-01', '2026-04-06');
    expect(delay95).toBe(95);
    expect(isBeyondLimit(delay95)).toBe(true);

    // 90 days exact boundary
    expect(isBeyondLimit(90)).toBe(false);
    expect(isBeyondLimit(91)).toBe(true);
  });
});
