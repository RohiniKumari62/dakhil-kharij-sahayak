import { describe, expect, it } from 'vitest';
import { decide, availableDecisions } from './stateMachine';
import { validateStepComplete } from './validateStep';
import type {
  ApplicationWorkflowState,
  Role,
  Step,
  Status,
} from './types';

interface MockAuditEvent {
  actor_role: Role;
  event_type: string;
  from_step: Step;
  to_step: Step;
  note?: string;
  new_status: Status;
}

describe('Phase 7: End-to-End Workflow Journey & Transitions', () => {
  it('forwards a case through all 5 steps as the three roles and approves it', () => {
    const auditLog: MockAuditEvent[] = [];

    let state: ApplicationWorkflowState = {
      step: 'SCRUTINY',
      status: 'IN_PROGRESS',
    };

    // --- STEP 1: SCRUTINY (Owner: revenue_officer) ---
    expect(availableDecisions(state, 'revenue_officer')).toEqual([
      'FORWARD',
      'RETURN',
      'REJECT',
    ]);
    expect(availableDecisions(state, 'halka_karamchari')).toEqual([]);
    expect(availableDecisions(state, 'circle_officer')).toEqual([]);

    // Check validation fails on incomplete data
    const scrutinyErrors = validateStepComplete('SCRUTINY', {});
    expect(scrutinyErrors).toContain('MISSING_DOCUMENTS_COMPLETE');

    // Scrutiny complete
    const scrutinyValid = validateStepComplete('SCRUTINY', {
      documentsComplete: true,
      mismatchNotes: '',
      officerRemarks: 'All verified',
    });
    expect(scrutinyValid).toHaveLength(0);

    const step1Result = decide(state, 'revenue_officer', 'FORWARD');
    expect(step1Result.ok).toBe(true);
    if (step1Result.ok) {
      auditLog.push({
        actor_role: 'revenue_officer',
        event_type: step1Result.event,
        from_step: step1Result.from,
        to_step: step1Result.to,
        new_status: step1Result.newStatus,
      });
      state = { step: step1Result.to, status: step1Result.newStatus };
    }

    expect(state.step).toBe('FIELD_ENQUIRY');
    expect(state.status).toBe('IN_PROGRESS');

    // --- STEP 2: FIELD_ENQUIRY (Owner: halka_karamchari) ---
    // RO cannot act here
    const roFieldAttempt = decide(state, 'revenue_officer', 'FORWARD');
    expect(roFieldAttempt).toEqual({ ok: false, reason: 'NOT_OWNER' });

    // Validation checks
    const fieldErrors = validateStepComplete('FIELD_ENQUIRY', {});
    expect(fieldErrors).toContain('MISSING_VISIT_DATE');
    expect(fieldErrors).toContain('MISSING_POSSESSION_STATUS');
    expect(fieldErrors).toContain('MISSING_REPORT_TEXT');

    const fieldValid = validateStepComplete('FIELD_ENQUIRY', {
      visitDate: '2026-11-10',
      possessionStatus: 'BUYER',
      reportText: 'स्थल निरीक्षण में पाया गया कि आवेदक का शांतिपूर्ण दखल-कब्जा है।',
    });
    expect(fieldValid).toHaveLength(0);

    const step2Result = decide(state, 'halka_karamchari', 'FORWARD');
    expect(step2Result.ok).toBe(true);
    if (step2Result.ok) {
      auditLog.push({
        actor_role: 'halka_karamchari',
        event_type: step2Result.event,
        from_step: step2Result.from,
        to_step: step2Result.to,
        new_status: step2Result.newStatus,
      });
      state = { step: step2Result.to, status: step2Result.newStatus };
    }

    expect(state.step).toBe('NOTICE_OBJECTION');

    // --- STEP 3: NOTICE_OBJECTION (Owner: revenue_officer) ---
    const noticeErrors = validateStepComplete('NOTICE_OBJECTION', {});
    expect(noticeErrors).toContain('MISSING_GENERAL_NOTICE_DATE');
    expect(noticeErrors).toContain('MISSING_OBJECTION_DEADLINE');

    const noticeValid = validateStepComplete('NOTICE_OBJECTION', {
      generalNoticeIssuedOn: '2026-11-11',
      objectionDeadline: '2026-11-25',
    });
    expect(noticeValid).toHaveLength(0);

    const step3Result = decide(state, 'revenue_officer', 'FORWARD');
    expect(step3Result.ok).toBe(true);
    if (step3Result.ok) {
      auditLog.push({
        actor_role: 'revenue_officer',
        event_type: step3Result.event,
        from_step: step3Result.from,
        to_step: step3Result.to,
        new_status: step3Result.newStatus,
      });
      state = { step: step3Result.to, status: step3Result.newStatus };
    }

    expect(state.step).toBe('HEARING_RECOMMENDATION');

    // --- STEP 4: HEARING_RECOMMENDATION (Owner: revenue_officer) ---
    const hearingErrors = validateStepComplete('HEARING_RECOMMENDATION', {});
    expect(hearingErrors).toContain('MISSING_RECOMMENDATION_TEXT');

    const hearingValid = validateStepComplete('HEARING_RECOMMENDATION', {
      hearingDate: '2026-11-26',
      summaryText: 'सुनवाई संपन्न हुई। कोई आपत्ति नहीं।',
      recommendationText: 'नामान्तरण की स्वीकृति हेतु अनुशंसा की जाती है।',
    });
    expect(hearingValid).toHaveLength(0);

    const step4Result = decide(state, 'revenue_officer', 'FORWARD');
    expect(step4Result.ok).toBe(true);
    if (step4Result.ok) {
      auditLog.push({
        actor_role: 'revenue_officer',
        event_type: step4Result.event,
        from_step: step4Result.from,
        to_step: step4Result.to,
        new_status: step4Result.newStatus,
      });
      state = { step: step4Result.to, status: step4Result.newStatus };
    }

    expect(state.step).toBe('FINAL_ORDER');

    // --- STEP 5: FINAL_ORDER (Owner: circle_officer) ---
    // RO cannot approve
    const roApproveAttempt = decide(state, 'revenue_officer', 'APPROVE');
    expect(roApproveAttempt).toEqual({ ok: false, reason: 'NOT_OWNER' });

    // Karamchari cannot approve
    const karamchariApproveAttempt = decide(state, 'halka_karamchari', 'APPROVE');
    expect(karamchariApproveAttempt).toEqual({ ok: false, reason: 'NOT_OWNER' });

    // CO approves
    const step5Result = decide(state, 'circle_officer', 'APPROVE', 'आदेश स्वीकृत किया गया');
    expect(step5Result.ok).toBe(true);
    if (step5Result.ok) {
      auditLog.push({
        actor_role: 'circle_officer',
        event_type: step5Result.event,
        from_step: step5Result.from,
        to_step: step5Result.to,
        note: 'आदेश स्वीकृत किया गया',
        new_status: step5Result.newStatus,
      });
      state = { step: step5Result.to, status: step5Result.newStatus };
    }

    expect(state.status).toBe('APPROVED');

    // Confirm audit log has all 5 sequential events
    expect(auditLog).toHaveLength(5);
    expect(auditLog.map((l) => l.event_type)).toEqual([
      'FORWARDED',
      'FORWARDED',
      'FORWARDED',
      'FORWARDED',
      'APPROVED',
    ]);

    // Confirm acting on closed approved case fails with CASE_CLOSED
    const afterApproval = decide(state, 'circle_officer', 'RETURN', 'पुनः खोलें');
    expect(afterApproval).toEqual({ ok: false, reason: 'CASE_CLOSED' });
  });

  it('handles RETURN journey with mandatory note enforcement', () => {
    const auditLog: MockAuditEvent[] = [];

    // Case at STEP 5 (FINAL_ORDER)
    let state: ApplicationWorkflowState = {
      step: 'FINAL_ORDER',
      status: 'IN_PROGRESS',
    };

    // Return without note must fail
    expect(decide(state, 'circle_officer', 'RETURN')).toEqual({
      ok: false,
      reason: 'NOTE_REQUIRED',
    });

    // Return with short note (< 10 chars) must fail
    expect(decide(state, 'circle_officer', 'RETURN', 'त्रुटि है')).toEqual({
      ok: false,
      reason: 'NOTE_REQUIRED',
    });

    // Return with valid note succeeds
    const validReturnNote = 'पक्षकारों की पुनः सुनवाई आवश्यक है।';
    const returnResult = decide(state, 'circle_officer', 'RETURN', validReturnNote);
    expect(returnResult.ok).toBe(true);
    if (returnResult.ok) {
      auditLog.push({
        actor_role: 'circle_officer',
        event_type: returnResult.event,
        from_step: returnResult.from,
        to_step: returnResult.to,
        note: validReturnNote,
        new_status: returnResult.newStatus,
      });
      state = { step: returnResult.to, status: returnResult.newStatus };
    }

    expect(state.step).toBe('HEARING_RECOMMENDATION');
    expect(state.status).toBe('IN_PROGRESS');
    expect(auditLog[0].event_type).toBe('RETURNED');
    expect(auditLog[0].note).toBe(validReturnNote);

    // Return at SCRUTINY returns to applicant
    let scrutinyState: ApplicationWorkflowState = {
      step: 'SCRUTINY',
      status: 'IN_PROGRESS',
    };

    const scrutinyReturnNote = 'आवेदन के साथ वंशावली प्रमाणपत्र संलग्न नहीं है।';
    const scrutinyReturnRes = decide(
      scrutinyState,
      'revenue_officer',
      'RETURN',
      scrutinyReturnNote
    );
    expect(scrutinyReturnRes.ok).toBe(true);
    if (scrutinyReturnRes.ok) {
      scrutinyState = {
        step: scrutinyReturnRes.to,
        status: scrutinyReturnRes.newStatus,
      };
    }

    expect(scrutinyState.status).toBe('RETURNED_TO_APPLICANT');

    // Closed case check on returned application
    expect(
      decide(scrutinyState, 'revenue_officer', 'FORWARD')
    ).toEqual({ ok: false, reason: 'CASE_CLOSED' });
  });

  it('handles REJECT journey at SCRUTINY and FINAL_ORDER', () => {
    // Rejection at SCRUTINY
    let stateScrutiny: ApplicationWorkflowState = {
      step: 'SCRUTINY',
      status: 'IN_PROGRESS',
    };

    const rejectNoteScrutiny = 'सरकारी गैर-मजरूआ भूमि होने के कारण अस्वीकृत किया जाता है।';
    const rejectScrutiny = decide(
      stateScrutiny,
      'revenue_officer',
      'REJECT',
      rejectNoteScrutiny
    );
    expect(rejectScrutiny.ok).toBe(true);
    if (rejectScrutiny.ok) {
      stateScrutiny = {
        step: rejectScrutiny.to,
        status: rejectScrutiny.newStatus,
      };
    }
    expect(stateScrutiny.status).toBe('REJECTED');

    // Acting on rejected case fails with CASE_CLOSED
    expect(
      decide(stateScrutiny, 'revenue_officer', 'FORWARD')
    ).toEqual({ ok: false, reason: 'CASE_CLOSED' });

    // Rejection at FINAL_ORDER
    let stateFinal: ApplicationWorkflowState = {
      step: 'FINAL_ORDER',
      status: 'IN_PROGRESS',
    };

    const rejectNoteFinal = 'सक्षम न्यायालय का स्थगन आदेश होने से नामान्तरण अस्वीकृत।';
    const rejectFinal = decide(
      stateFinal,
      'circle_officer',
      'REJECT',
      rejectNoteFinal
    );
    expect(rejectFinal.ok).toBe(true);
    if (rejectFinal.ok) {
      stateFinal = {
        step: rejectFinal.to,
        status: rejectFinal.newStatus,
      };
    }
    expect(stateFinal.status).toBe('REJECTED');
    expect(
      decide(stateFinal, 'circle_officer', 'APPROVE')
    ).toEqual({ ok: false, reason: 'CASE_CLOSED' });
  });
});
