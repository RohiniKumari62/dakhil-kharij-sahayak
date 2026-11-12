'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { hi } from '@/lib/i18n/hi';
import {
  resolveSuggestion,
  type RequestSuggestionResult,
} from '@/app/(app)/applications/[id]/ai-actions';
import type { AnyAiOutput } from '@/lib/ai/schemas';

interface Props {
  buttonLabel: string;
  onRequest: () => Promise<RequestSuggestionResult>;
  onApply: (output: AnyAiOutput, suggestionId: string) => void;
  onDiscard?: () => void;
  isEditable: boolean;
  renderContent?: (output: AnyAiOutput, suggestionId: string) => ReactNode;
}

export function AiSuggestionPanel({
  buttonLabel,
  onRequest,
  onApply,
  onDiscard,
  isEditable,
  renderContent,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [suggestionOutput, setSuggestionOutput] = useState<AnyAiOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  if (!isEditable) {
    return null;
  }

  const handleRequest = () => {
    setErrorMessage(null);
    setIsApplied(false);

    startTransition(async () => {
      try {
        const res = await onRequest();
        if (res.ok) {
          setActiveSuggestionId(res.suggestionId);
          setSuggestionOutput(res.output);
        } else {
          setErrorMessage(hi.ai.errorFallback);
        }
      } catch {
        setErrorMessage(hi.ai.errorFallback);
      }
    });
  };

  const handleApply = () => {
    if (!activeSuggestionId || !suggestionOutput) return;
    setIsApplied(true);
    onApply(suggestionOutput, activeSuggestionId);
  };

  const handleDiscard = () => {
    if (!activeSuggestionId) {
      setSuggestionOutput(null);
      return;
    }

    const sugId = activeSuggestionId;
    setActiveSuggestionId(null);
    setSuggestionOutput(null);
    setIsApplied(false);
    onDiscard?.();

    startTransition(async () => {
      await resolveSuggestion(sugId, 'DISCARD');
    });
  };

  return (
    <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRequest}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-sm sm:text-base shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-50"
          >
            <span>✨</span>
            <span>{isPending ? hi.ai.loadingText : buttonLabel}</span>
          </button>
        </div>

        {/* Disclaimer */}
        <div
          role="note"
          className="text-xs sm:text-sm text-indigo-950 font-medium bg-indigo-100/60 px-3 py-1.5 rounded-md border border-indigo-200"
        >
          {hi.ai.disclaimer}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-lg text-sm font-semibold"
        >
          {errorMessage}
        </div>
      )}

      {/* Suggestion Result Preview & Actions */}
      {suggestionOutput && activeSuggestionId && (
        <div className="space-y-4 pt-2 border-t border-indigo-200">
          {renderContent ? (
            renderContent(suggestionOutput, activeSuggestionId)
          ) : (
            <div className="p-3 bg-white border border-indigo-200 rounded-lg text-sm font-mono whitespace-pre-wrap text-zinc-800">
              {JSON.stringify(suggestionOutput, null, 2)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isPending || isApplied}
              onClick={handleApply}
              className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-xs disabled:opacity-50"
            >
              ✓ {isApplied ? hi.ai.applied : hi.ai.buttonUse}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDiscard}
              className="min-h-[44px] px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 font-semibold rounded-lg text-sm"
            >
              ✕ {hi.ai.buttonDiscard}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
