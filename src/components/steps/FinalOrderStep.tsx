'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { FinalOrderData } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';

interface Props {
  applicationId: string;
  initialData?: Partial<FinalOrderData>;
  isEditable: boolean;
}

export function FinalOrderStep({ applicationId, initialData, isEditable }: Props) {
  const [isPending, startTransition] = useTransition();
  const [orderText, setOrderText] = useState<string>(initialData?.orderText ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(applicationId, 'FINAL_ORDER', {
        orderText,
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
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600">
        {hi.stepForms.finalOrder.orderDraftNotice}
      </div>

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
