// Pure state machine for Bihar Land Mutation (Dakhil-Kharij) workflow
// Zero framework, UI or database dependencies

import {
  type ApplicationWorkflowState,
  type Decision,
  type DecideResult,
  type Role,
  STEP_ORDER,
  STEP_OWNER,
} from './types';

/**
 * Returns the list of permitted decisions for an application given the user's role.
 * Non-owners or closed cases have no available decisions.
 */
export function availableDecisions(
  app: ApplicationWorkflowState,
  role: Role
): Decision[] {
  if (app.status !== 'IN_PROGRESS') {
    return [];
  }

  if (STEP_OWNER[app.step] !== role) {
    return [];
  }

  switch (app.step) {
    case 'SCRUTINY':
      return ['FORWARD', 'RETURN', 'REJECT'];
    case 'FIELD_ENQUIRY':
    case 'NOTICE_OBJECTION':
    case 'HEARING_RECOMMENDATION':
      return ['FORWARD', 'RETURN'];
    case 'FINAL_ORDER':
      return ['APPROVE', 'REJECT', 'RETURN'];
    default:
      return [];
  }
}

function hasValidNote(note?: string): boolean {
  return typeof note === 'string' && note.trim().length >= 10;
}

/**
 * Validates and calculates a state transition.
 * Returns either { ok: true, event, from, to, newStatus } or { ok: false, reason }.
 */
export function decide(
  app: ApplicationWorkflowState,
  role: Role,
  decision: Decision,
  note?: string
): DecideResult {
  // 1. Ownership check: Only the designated step owner can act
  if (STEP_OWNER[app.step] !== role) {
    return { ok: false, reason: 'NOT_OWNER' };
  }

  // 2. Lifecycle check: Closed cases cannot transition
  if (app.status !== 'IN_PROGRESS') {
    return { ok: false, reason: 'CASE_CLOSED' };
  }

  const currentIndex = STEP_ORDER.indexOf(app.step);

  switch (decision) {
    case 'FORWARD': {
      // FORWARD allowed only for steps 1 through 4 (SCRUTINY -> HEARING_RECOMMENDATION)
      if (app.step === 'FINAL_ORDER' || currentIndex >= STEP_ORDER.length - 1) {
        return { ok: false, reason: 'DECISION_NOT_ALLOWED' };
      }

      const nextStep = STEP_ORDER[currentIndex + 1];
      return {
        ok: true,
        event: 'FORWARDED',
        from: app.step,
        to: nextStep,
        newStatus: 'IN_PROGRESS',
      };
    }

    case 'RETURN': {
      // RETURN always requires a mandatory note of at least 10 characters
      if (!hasValidNote(note)) {
        return { ok: false, reason: 'NOTE_REQUIRED' };
      }

      // At SCRUTINY, return is back to the applicant
      if (app.step === 'SCRUTINY') {
        return {
          ok: true,
          event: 'RETURNED_TO_APPLICANT',
          from: 'SCRUTINY',
          to: 'SCRUTINY',
          newStatus: 'RETURNED_TO_APPLICANT',
        };
      }

      // At steps 2 to 5, return steps back to the previous stage
      const previousStep = STEP_ORDER[currentIndex - 1];
      return {
        ok: true,
        event: 'RETURNED',
        from: app.step,
        to: previousStep,
        newStatus: 'IN_PROGRESS',
      };
    }

    case 'REJECT': {
      // REJECT is allowed only at SCRUTINY and FINAL_ORDER
      if (app.step !== 'SCRUTINY' && app.step !== 'FINAL_ORDER') {
        return { ok: false, reason: 'DECISION_NOT_ALLOWED' };
      }

      // REJECT always requires an explanatory note of at least 10 characters
      if (!hasValidNote(note)) {
        return { ok: false, reason: 'NOTE_REQUIRED' };
      }

      return {
        ok: true,
        event: 'REJECTED',
        from: app.step,
        to: app.step,
        newStatus: 'REJECTED',
      };
    }

    case 'APPROVE': {
      // APPROVE is allowed only at FINAL_ORDER by circle_officer
      if (app.step !== 'FINAL_ORDER') {
        return { ok: false, reason: 'DECISION_NOT_ALLOWED' };
      }

      return {
        ok: true,
        event: 'APPROVED',
        from: app.step,
        to: app.step,
        newStatus: 'APPROVED',
      };
    }

    default:
      return { ok: false, reason: 'DECISION_NOT_ALLOWED' };
  }
}
