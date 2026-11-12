'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { availableDecisions } from '@/lib/workflow/stateMachine';
import type {
  Decision,
  Role,
  Step,
  Status,
  ApplicationWorkflowState,
} from '@/lib/workflow/types';
import { hi } from '@/lib/i18n/hi';
import {
  submitDecision,
  type SubmitDecisionResult,
} from '@/app/(app)/applications/[id]/actions';
import type { StepValidationErrorCode } from '@/lib/workflow/validateStep';

interface Props {
  applicationId: string;
  currentStep: Step;
  status: Status;
  userRole: Role;
}

export function DecisionBar({
  applicationId,
  currentStep,
  status,
  userRole,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [activeModalDecision, setActiveModalDecision] = useState<Decision | null>(
    null
  );
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  // General error and validation alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    StepValidationErrorCode[]
  >([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const appState: ApplicationWorkflowState = { step: currentStep, status };
  const allowed = availableDecisions(appState, userRole);

  if (allowed.length === 0) {
    return null;
  }

  const handleForward = () => {
    setErrorMessage(null);
    setValidationErrors([]);
    setSuccessMessage(null);

    startTransition(async () => {
      const res: SubmitDecisionResult = await submitDecision(
        applicationId,
        'FORWARD'
      );
      if (res.ok) {
        setSuccessMessage(hi.dialog.forwardSuccess);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        if (res.error === 'VALIDATION_FAILED' && res.validationErrors) {
          setValidationErrors(res.validationErrors);
        } else {
          const msg =
            hi.errors[res.error as keyof typeof hi.errors] ||
            hi.errors.UNKNOWN_ERROR;
          setErrorMessage(msg);
        }
      }
    });
  };

  const handleOpenDialog = (dec: Decision) => {
    setActiveModalDecision(dec);
    setNote('');
    setNoteError(null);
    setErrorMessage(null);
    setValidationErrors([]);
  };

  const handleConfirmModal = () => {
    if (!activeModalDecision) return;

    // Validate mandatory note (min 10 characters) for RETURN and REJECT
    if (activeModalDecision === 'RETURN' || activeModalDecision === 'REJECT') {
      if (!note.trim() || note.trim().length < 10) {
        setNoteError(hi.dialog.noteRequiredError);
        return;
      }
    }

    startTransition(async () => {
      const res = await submitDecision(
        applicationId,
        activeModalDecision,
        note.trim() || undefined
      );

      if (res.ok) {
        setActiveModalDecision(null);
        setSuccessMessage(hi.caseDetail.decisionSuccess);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        const msg =
          hi.errors[res.error as keyof typeof hi.errors] ||
          hi.errors.UNKNOWN_ERROR;
        setErrorMessage(msg);
      }
    });
  };

  const getDecisionButtonClasses = (decision: Decision) => {
    switch (decision) {
      case 'FORWARD':
        return 'bg-blue-600 hover:bg-blue-700 text-white ring-blue-500';
      case 'APPROVE':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white ring-emerald-500';
      case 'RETURN':
        return 'bg-amber-600 hover:bg-amber-700 text-white ring-amber-500';
      case 'REJECT':
        return 'bg-red-600 hover:bg-red-700 text-white ring-red-500';
    }
  };

  const getConfirmationExplanation = (decision: Decision) => {
    switch (decision) {
      case 'APPROVE':
        return hi.caseDetail.confirmApproveText;
      case 'REJECT':
        return hi.caseDetail.confirmRejectText;
      case 'RETURN':
        return hi.caseDetail.confirmReturnText;
      default:
        return '';
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-zinc-300 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-base font-bold text-zinc-900">
          {hi.caseDetail.decisionSectionTitle}
        </div>

        <div className="flex flex-wrap gap-3">
          {allowed.map((decision) => {
            const isForward = decision === 'FORWARD';
            return (
              <button
                key={decision}
                type="button"
                disabled={isPending}
                onClick={() =>
                  isForward ? handleForward() : handleOpenDialog(decision)
                }
                className={`min-h-[44px] px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base shadow-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${getDecisionButtonClasses(
                  decision
                )}`}
              >
                {hi.decisions[decision]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* General Error Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <span>⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Missing Fields Validation Error Notification */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 space-y-2"
        >
          <div className="font-bold text-sm">
            {hi.errors.VALIDATION_FAILED}
          </div>
          <ul className="list-disc list-inside text-sm space-y-1">
            {validationErrors.map((code) => (
              <li key={code}>
                {hi.stepValidationErrors[code] || code}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation Modal for RETURN, REJECT, APPROVE */}
      {activeModalDecision && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              {hi.dialog.confirmTitle}: {hi.decisions[activeModalDecision]}
            </h3>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 font-medium leading-relaxed">
              {getConfirmationExplanation(activeModalDecision)}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-zinc-800">
                {hi.dialog.noteLabel}{' '}
                {(activeModalDecision === 'RETURN' ||
                  activeModalDecision === 'REJECT') && (
                  <span className="text-red-600">*</span>
                )}
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (noteError) setNoteError(null);
                }}
                placeholder={hi.caseDetail.notePlaceholder}
                className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {noteError && (
                <p className="text-xs text-red-600 font-semibold">{noteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setActiveModalDecision(null)}
                className="min-h-[44px] px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-lg font-semibold text-sm"
              >
                {hi.dialog.cancel}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmModal}
                className={`min-h-[44px] px-6 py-2 rounded-lg font-bold text-sm text-white shadow-xs ${getDecisionButtonClasses(
                  activeModalDecision
                )}`}
              >
                {isPending ? hi.dialog.processing : hi.dialog.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
