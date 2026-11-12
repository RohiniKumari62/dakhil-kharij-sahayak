'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { FinalOrderData } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';
import { requestSuggestion } from '@/app/(app)/applications/[id]/ai-actions';
import { AiSuggestionPanel } from '@/components/AiSuggestionPanel';
import type { OrderDraftOutput } from '@/lib/ai/schemas';

interface Props {
  applicationId: string;
  initialData?: Partial<FinalOrderData>;
  isEditable: boolean;
}

export function FinalOrderStep({ applicationId, initialData, isEditable }: Props) {
  const [isPending, startTransition] = useTransition();
  const [orderText, setOrderText] = useState<string>(initialData?.orderText ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  // Circle Officer intended decision choice before asking AI
  const [intendedDecision, setIntendedDecision] = useState<'APPROVE' | 'REJECT'>(
    'APPROVE'
  );
  const [lastGeneratedFor, setLastGeneratedFor] = useState<
    'APPROVE' | 'REJECT' | null
  >(null);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(
        applicationId,
        'FINAL_ORDER',
        {
          orderText,
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

  const isDecisionMismatch =
    lastGeneratedFor !== null && lastGeneratedFor !== intendedDecision;

  return (
    <div className="space-y-5">
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600">
        {hi.stepForms.finalOrder.orderDraftNotice}
      </div>

      {/* Intended Decision Selector */}
      {isEditable && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <label className="block text-sm font-bold text-zinc-900">
            {hi.ai.chooseDecisionFirst}
          </label>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
              <input
                type="radio"
                name="intendedDecision"
                value="APPROVE"
                checked={intendedDecision === 'APPROVE'}
                onChange={() => setIntendedDecision('APPROVE')}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-semibold text-emerald-900">
                {hi.ai.intendedApprove}
              </span>
            </label>

            <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
              <input
                type="radio"
                name="intendedDecision"
                value="REJECT"
                checked={intendedDecision === 'REJECT'}
                onChange={() => setIntendedDecision('REJECT')}
                className="w-5 h-5 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-semibold text-red-900">
                {hi.ai.intendedReject}
              </span>
            </label>
          </div>

          {isDecisionMismatch && (
            <div
              role="alert"
              className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-bold flex items-center gap-2"
            >
              <span>⚠</span>
              <span>{hi.ai.mismatchWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Suggestion Panel for Drafting Final Order */}
      <AiSuggestionPanel
        buttonLabel={hi.ai.orderButton}
        isEditable={isEditable}
        onRequest={async () => {
          setLastGeneratedFor(intendedDecision);
          return requestSuggestion(
            applicationId,
            'FINAL_ORDER',
            'ORDER_DRAFT',
            undefined,
            { intendedDecision }
          );
        }}
        onApply={(rawOutput, sugId) => {
          const data = rawOutput as OrderDraftOutput;
          setActiveSuggestionId(sugId);
          if (data.orderTextHi) {
            setOrderText(data.orderTextHi);
          }
        }}
        onDiscard={() => {
          setActiveSuggestionId(null);
          setLastGeneratedFor(null);
        }}
        renderContent={(rawOutput) => {
          const data = rawOutput as OrderDraftOutput;
          return (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                {hi.stepForms.finalOrder.draftOrderHeading}
              </h4>
              <div className="p-3 bg-white border border-indigo-200 rounded text-sm text-zinc-900 leading-relaxed font-sans whitespace-pre-wrap">
                {data.orderTextHi}
              </div>
              {data.missingFacts && data.missingFacts.length > 0 && (
                <div className="text-xs text-amber-900">
                  <span className="font-bold">{hi.stepForms.finalOrder.missingFactsLabel} </span>
                  <span>{data.missingFacts.join(', ')}</span>
                </div>
              )}
            </div>
          );
        }}
      />

      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
          {hi.stepForms.finalOrder.orderText}
        </label>
        <textarea
          rows={8}
          disabled={!isEditable}
          value={orderText}
          onChange={(e) => setOrderText(e.target.value)}
          className="w-full p-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500 leading-relaxed font-sans"
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
