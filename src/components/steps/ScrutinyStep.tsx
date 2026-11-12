'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import { isBeyondLimit, registrationDelayDays } from '@/lib/workflow/sla';
import type { ScrutinyData } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';

interface Props {
  applicationId: string;
  initialData?: Partial<ScrutinyData>;
  deedText?: string | null;
  deedDate?: string | null;
  receivedOn: string;
  isEditable: boolean;
}

export function ScrutinyStep({
  applicationId,
  initialData,
  deedText,
  deedDate,
  receivedOn,
  isEditable,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [documentsComplete, setDocumentsComplete] = useState<boolean>(
    initialData?.documentsComplete ?? true
  );
  const [mismatchNotes, setMismatchNotes] = useState(initialData?.mismatchNotes ?? '');
  const [officerRemarks, setOfficerRemarks] = useState(initialData?.officerRemarks ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const delayDays = deedDate ? registrationDelayDays(deedDate, receivedOn) : 0;
  const isDelayed = isBeyondLimit(delayDays);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(applicationId, 'SCRUTINY', {
        documentsComplete,
        mismatchNotes,
        officerRemarks,
      });

      if (res.ok) {
        setStatusMessage(hi.caseDetail.saveSuccess);
      } else {
        setStatusMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {isDelayed && (
        <div
          role="alert"
          className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm font-semibold flex items-center gap-2"
        >
          <span>⚠</span>
          <span>
            {hi.stepForms.scrutiny.delayNotice} ({delayDays} {hi.common.daysUnit})
          </span>
        </div>
      )}

      {deedText && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <h3 className="text-sm font-bold text-zinc-800">
            {hi.stepForms.scrutiny.deedTextHeading}
          </h3>
          <p className="text-sm text-zinc-700 whitespace-pre-line font-mono bg-white p-3 rounded border border-zinc-200">
            {deedText}
          </p>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-base font-semibold text-zinc-800 mb-2">
            {hi.stepForms.scrutiny.documentsComplete}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
              <input
                type="radio"
                name="documentsComplete"
                disabled={!isEditable}
                checked={documentsComplete === true}
                onChange={() => setDocumentsComplete(true)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-base text-zinc-900">{hi.stepForms.scrutiny.yes}</span>
            </label>
            <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
              <input
                type="radio"
                name="documentsComplete"
                disabled={!isEditable}
                checked={documentsComplete === false}
                onChange={() => setDocumentsComplete(false)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-base text-zinc-900">{hi.stepForms.scrutiny.no}</span>
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="mismatchNotes"
            className="block text-base font-semibold text-zinc-800 mb-1"
          >
            {hi.stepForms.scrutiny.mismatchNotes}
          </label>
          <textarea
            id="mismatchNotes"
            disabled={!isEditable}
            rows={3}
            value={mismatchNotes}
            onChange={(e) => setMismatchNotes(e.target.value)}
            className="w-full p-3 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 disabled:bg-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="officerRemarks"
            className="block text-base font-semibold text-zinc-800 mb-1"
          >
            {hi.stepForms.scrutiny.officerRemarks}
          </label>
          <textarea
            id="officerRemarks"
            disabled={!isEditable}
            rows={3}
            value={officerRemarks}
            onChange={(e) => setOfficerRemarks(e.target.value)}
            className="w-full p-3 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 disabled:bg-zinc-100"
          />
        </div>

        {isEditable && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="min-h-[44px] px-5 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-base rounded-lg transition-colors focus:outline-2 focus:outline-blue-800 disabled:opacity-50"
            >
              {isPending ? hi.common.loading : hi.common.save}
            </button>
            {statusMessage && (
              <span className="text-sm font-medium text-emerald-700">
                {statusMessage}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
