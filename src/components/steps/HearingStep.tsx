'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { HearingData } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';

interface Props {
  applicationId: string;
  initialData?: Partial<HearingData>;
  isEditable: boolean;
}

export function HearingStep({ applicationId, initialData, isEditable }: Props) {
  const [isPending, startTransition] = useTransition();
  const [hearingDate, setHearingDate] = useState<string>(
    initialData?.hearingDate ?? ''
  );
  const [summaryText, setSummaryText] = useState<string>(
    initialData?.summaryText ?? ''
  );
  const [recommendationText, setRecommendationText] = useState<string>(
    initialData?.recommendationText ?? ''
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(applicationId, 'HEARING_RECOMMENDATION', {
        hearingDate: hearingDate || null,
        summaryText,
        recommendationText,
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
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
          {hi.stepForms.hearing.hearingDate}
        </label>
        <input
          type="date"
          disabled={!isEditable}
          value={hearingDate}
          onChange={(e) => setHearingDate(e.target.value)}
          className="w-full sm:w-64 min-h-[44px] px-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
          {hi.stepForms.hearing.summaryText}
        </label>
        <textarea
          rows={4}
          disabled={!isEditable}
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
          className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
          {hi.stepForms.hearing.recommendationText}
        </label>
        <textarea
          rows={4}
          disabled={!isEditable}
          value={recommendationText}
          onChange={(e) => setRecommendationText(e.target.value)}
          className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
        />
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm font-medium"
        >
          {statusMessage}
        </div>
      )}

      {isEditable && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50"
          >
            {isPending ? hi.caseDetail.saving : hi.caseDetail.saveButton}
          </button>
        </div>
      )}
    </div>
  );
}
