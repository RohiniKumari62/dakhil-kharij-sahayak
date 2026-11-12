'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import { isBeyondLimit, registrationDelayDays } from '@/lib/workflow/sla';
import type { ScrutinyData } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';
import { requestSuggestion } from '@/app/(app)/applications/[id]/ai-actions';
import { AiSuggestionPanel } from '@/components/AiSuggestionPanel';
import type { ScrutinyExtractOutput } from '@/lib/ai/schemas';

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
  const [mismatchNotes, setMismatchNotes] = useState(
    initialData?.mismatchNotes ?? ''
  );
  const [officerRemarks, setOfficerRemarks] = useState(
    initialData?.officerRemarks ?? ''
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
    null
  );

  const delayDays = deedDate ? registrationDelayDays(deedDate, receivedOn) : 0;
  const isDelayed = isBeyondLimit(delayDays);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(
        applicationId,
        'SCRUTINY',
        {
          documentsComplete,
          mismatchNotes,
          officerRemarks,
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

      {/* AI Suggestion Panel */}
      <AiSuggestionPanel
        buttonLabel={hi.ai.scrutinyButton}
        isEditable={isEditable}
        onRequest={() =>
          requestSuggestion(applicationId, 'SCRUTINY', 'SCRUTINY_EXTRACT')
        }
        onApply={(rawOutput, sugId) => {
          const output = rawOutput as ScrutinyExtractOutput;
          setActiveSuggestionId(sugId);
          if (output.summaryHi) {
            setMismatchNotes(output.summaryHi);
          }
          if (output.mismatches && output.mismatches.length > 0) {
            setDocumentsComplete(false);
          }
        }}
        onDiscard={() => setActiveSuggestionId(null)}
        renderContent={(rawOutput) => {
          const data = rawOutput as ScrutinyExtractOutput;
          return (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-indigo-950">
                {hi.ai.extractedFacts}:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white rounded border border-indigo-100">
                  <span className="text-zinc-500 block">विक्रेता:</span>
                  <span className="font-semibold text-zinc-900">
                    {data.extracted?.sellerName}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100">
                  <span className="text-zinc-500 block">क्रेता:</span>
                  <span className="font-semibold text-zinc-900">
                    {data.extracted?.buyerName}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100">
                  <span className="text-zinc-500 block">खाता/खेसरा:</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    {data.extracted?.khataNo} / {data.extracted?.khesraNo}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100">
                  <span className="text-zinc-500 block">रकबा:</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    {data.extracted?.areaDecimal} डिसमिल
                  </span>
                </div>
              </div>

              {data.mismatches && data.mismatches.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <h5 className="text-xs font-bold text-red-900">
                    {hi.ai.detectedMismatches}:
                  </h5>
                  <div className="space-y-1">
                    {data.mismatches.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-950 flex justify-between"
                      >
                        <span>{m.explanationHi}</span>
                        <span className="font-bold text-red-700">
                          {m.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {data.summaryHi && (
                <div className="p-3 bg-white border border-indigo-200 rounded text-sm text-zinc-800">
                  {data.summaryHi}
                </div>
              )}
            </div>
          );
        }}
      />

      {/* Scrutiny Form Fields */}
      <div className="space-y-4 pt-1">
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
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            {hi.stepForms.scrutiny.mismatchNotes}
          </label>
          <textarea
            rows={3}
            disabled={!isEditable}
            value={mismatchNotes}
            onChange={(e) => setMismatchNotes(e.target.value)}
            className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            {hi.stepForms.scrutiny.officerRemarks}
          </label>
          <textarea
            rows={2}
            disabled={!isEditable}
            value={officerRemarks}
            onChange={(e) => setOfficerRemarks(e.target.value)}
            className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
          />
        </div>
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
