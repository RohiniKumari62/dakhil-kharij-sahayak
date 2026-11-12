'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { HearingData } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';
import { requestSuggestion } from '@/app/(app)/applications/[id]/ai-actions';
import { AiSuggestionPanel } from '@/components/AiSuggestionPanel';
import type { HearingSummaryOutput } from '@/lib/ai/schemas';

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
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(
        applicationId,
        'HEARING_RECOMMENDATION',
        {
          hearingDate: hearingDate || null,
          summaryText,
          recommendationText,
        },
        activeSuggestionId || undefined
      );

      if (res.ok) {
        setStatusMessage(hi.caseDetail.saveSuccess);
      } else {
        setStatusMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-5">
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

      {/* AI Suggestion Panel for Hearing Summary & Recommendation */}
      <AiSuggestionPanel
        buttonLabel={hi.ai.hearingButton}
        isEditable={isEditable}
        onRequest={() =>
          requestSuggestion(
            applicationId,
            'HEARING_RECOMMENDATION',
            'HEARING_SUMMARY'
          )
        }
        onApply={(rawOutput, sugId) => {
          const data = rawOutput as HearingSummaryOutput;
          setActiveSuggestionId(sugId);
          if (data.summaryHi) {
            setSummaryText(data.summaryHi);
          }
          if (data.draftRecommendationHi) {
            setRecommendationText(data.draftRecommendationHi);
          }
        }}
        onDiscard={() => setActiveSuggestionId(null)}
        renderContent={(rawOutput) => {
          const data = rawOutput as HearingSummaryOutput;
          return (
            <div className="space-y-3">
              {data.summaryHi && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide mb-1">
                    {hi.stepForms.hearing.summaryDraftHeading}
                  </h4>
                  <div className="p-3 bg-white border border-indigo-200 rounded text-sm text-zinc-800 leading-relaxed font-sans">
                    {data.summaryHi}
                  </div>
                </div>
              )}

              {data.keyRisks && data.keyRisks.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    {hi.ai.keyRisks}:
                  </h4>
                  {data.keyRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950"
                    >
                      <span className="font-bold">{risk.titleHi}: </span>
                      <span>{risk.whyHi} </span>
                      <span className="text-amber-800 font-mono">
                        ({risk.evidence})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {data.pointsFor && data.pointsFor.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1">
                    {hi.ai.pointsForTitle}:
                  </h4>
                  <ul className="list-disc list-inside text-xs text-emerald-950 space-y-0.5">
                    {data.pointsFor.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.draftRecommendationHi && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide mb-1">
                    {hi.stepForms.hearing.recommendationDraftHeading}
                  </h4>
                  <div className="p-3 bg-white border border-indigo-200 rounded text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {data.draftRecommendationHi}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />

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
