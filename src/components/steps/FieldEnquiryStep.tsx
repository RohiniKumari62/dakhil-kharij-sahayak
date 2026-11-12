'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { FieldEnquiryData, PossessionStatus } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';
import { requestSuggestion } from '@/app/(app)/applications/[id]/ai-actions';
import { AiSuggestionPanel } from '@/components/AiSuggestionPanel';
import type { FieldReportOutput } from '@/lib/ai/schemas';

interface Props {
  applicationId: string;
  initialData?: Partial<FieldEnquiryData>;
  isEditable: boolean;
}

export function FieldEnquiryStep({ applicationId, initialData, isEditable }: Props) {
  const [isPending, startTransition] = useTransition();

  const [visitDate, setVisitDate] = useState(initialData?.visitDate ?? '');
  const [possessionStatus, setPossessionStatus] = useState<PossessionStatus>(
    initialData?.possessionStatus ?? 'BUYER'
  );
  const [coSharersPresent, setCoSharersPresent] = useState(
    initialData?.coSharersPresent ?? false
  );
  const [boundaryDispute, setBoundaryDispute] = useState(
    initialData?.boundaryDispute ?? false
  );
  const [roughNotes, setRoughNotes] = useState(initialData?.roughNotes ?? '');
  const [reportText, setReportText] = useState(initialData?.reportText ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(
        applicationId,
        'FIELD_ENQUIRY',
        {
          visitDate,
          possessionStatus,
          coSharersPresent,
          boundaryDispute,
          roughNotes,
          reportText,
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
        <label
          htmlFor="visitDate"
          className="block text-base font-semibold text-zinc-800 mb-1"
        >
          {hi.stepForms.fieldEnquiry.visitDate}
        </label>
        <input
          id="visitDate"
          type="date"
          disabled={!isEditable}
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="w-full sm:w-64 min-h-[44px] px-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="possessionStatus"
          className="block text-base font-semibold text-zinc-800 mb-1"
        >
          {hi.stepForms.fieldEnquiry.possessionStatus}
        </label>
        <select
          id="possessionStatus"
          disabled={!isEditable}
          value={possessionStatus}
          onChange={(e) => setPossessionStatus(e.target.value as PossessionStatus)}
          className="w-full sm:w-80 min-h-[44px] px-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
        >
          <option value="BUYER">
            {hi.stepForms.fieldEnquiry.possessionOptions.BUYER}
          </option>
          <option value="SELLER">
            {hi.stepForms.fieldEnquiry.possessionOptions.SELLER}
          </option>
          <option value="THIRD_PARTY">
            {hi.stepForms.fieldEnquiry.possessionOptions.THIRD_PARTY}
          </option>
          <option value="VACANT">
            {hi.stepForms.fieldEnquiry.possessionOptions.VACANT}
          </option>
        </select>
      </div>

      <div className="space-y-3 pt-1">
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            disabled={!isEditable}
            checked={coSharersPresent}
            onChange={(e) => setCoSharersPresent(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-base text-zinc-800 font-medium">
            {hi.stepForms.fieldEnquiry.coSharersPresent}
          </span>
        </label>

        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            disabled={!isEditable}
            checked={boundaryDispute}
            onChange={(e) => setBoundaryDispute(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-base text-zinc-800 font-medium">
            {hi.stepForms.fieldEnquiry.boundaryDispute}
          </span>
        </label>
      </div>

      <div>
        <label
          htmlFor="roughNotes"
          className="block text-base font-semibold text-zinc-800 mb-1"
        >
          {hi.stepForms.fieldEnquiry.roughNotes}
        </label>
        <textarea
          id="roughNotes"
          rows={3}
          disabled={!isEditable}
          value={roughNotes}
          onChange={(e) => setRoughNotes(e.target.value)}
          placeholder={hi.stepForms.fieldEnquiry.roughNotesPlaceholder}
          className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
        />
      </div>

      {/* AI Suggestion Panel */}
      <AiSuggestionPanel
        buttonLabel={hi.ai.fieldReportButton}
        isEditable={isEditable}
        onRequest={() =>
          requestSuggestion(applicationId, 'FIELD_ENQUIRY', 'FIELD_REPORT', {
            roughNotes,
          })
        }
        onApply={(rawOutput, sugId) => {
          const output = rawOutput as FieldReportOutput;
          setActiveSuggestionId(sugId);
          if (output.reportText) {
            setReportText(output.reportText);
          }
          if (output.possessionStatus && output.possessionStatus !== 'UNKNOWN') {
            setPossessionStatus(output.possessionStatus as PossessionStatus);
          }
          if (output.boundaryDispute !== null) {
            setBoundaryDispute(output.boundaryDispute);
          }
        }}
        onDiscard={() => setActiveSuggestionId(null)}
        renderContent={(rawOutput) => {
          const data = rawOutput as FieldReportOutput;
          return (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-indigo-950">
                {hi.ai.suggestedReport}:
              </h4>
              <div className="p-3 bg-white border border-indigo-200 rounded text-sm text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                {data.reportText}
              </div>
              {data.coSharersMentioned && data.coSharersMentioned.length > 0 && (
                <div className="text-xs text-indigo-900">
                  <span className="font-bold">{hi.stepForms.fieldEnquiry.coSharersLabel} </span>
                  <span>{data.coSharersMentioned.join(', ')}</span>
                </div>
              )}
            </div>
          );
        }}
      />

      <div>
        <label
          htmlFor="reportText"
          className="block text-base font-semibold text-zinc-800 mb-1"
        >
          {hi.stepForms.fieldEnquiry.reportText}
        </label>
        <textarea
          id="reportText"
          rows={5}
          disabled={!isEditable}
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500 font-sans leading-relaxed"
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
