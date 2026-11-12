'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { FieldEnquiryData, PossessionStatus } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';

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

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(applicationId, 'FIELD_ENQUIRY', {
        visitDate,
        possessionStatus,
        coSharersPresent,
        boundaryDispute,
        roughNotes,
        reportText,
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
          className="w-full min-h-[44px] px-3 py-2 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 disabled:bg-zinc-100"
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
          className="w-full min-h-[44px] px-3 py-2 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 disabled:bg-zinc-100 bg-white"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <label className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            disabled={!isEditable}
            checked={coSharersPresent}
            onChange={(e) => setCoSharersPresent(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm sm:text-base font-medium text-zinc-800">
            {hi.stepForms.fieldEnquiry.coSharersPresent}
          </span>
        </label>

        <label className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            disabled={!isEditable}
            checked={boundaryDispute}
            onChange={(e) => setBoundaryDispute(e.target.checked)}
            className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
          />
          <span className="text-sm sm:text-base font-medium text-zinc-800">
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
          disabled={!isEditable}
          rows={3}
          value={roughNotes}
          onChange={(e) => setRoughNotes(e.target.value)}
          className="w-full p-3 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 disabled:bg-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="reportText"
          className="block text-base font-semibold text-zinc-800 mb-1"
        >
          {hi.stepForms.fieldEnquiry.reportText}
        </label>
        <textarea
          id="reportText"
          disabled={!isEditable}
          rows={5}
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
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
  );
}
