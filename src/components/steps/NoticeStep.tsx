'use client';

import { useState, useTransition } from 'react';
import { hi } from '@/lib/i18n/hi';
import type { NoticeData, NoticeParty, Objection } from '@/lib/workflow/types';
import { saveStepData } from '@/app/(app)/applications/[id]/actions';
import { requestSuggestion } from '@/app/(app)/applications/[id]/ai-actions';
import { AiSuggestionPanel } from '@/components/AiSuggestionPanel';
import type { NoticePartiesOutput } from '@/lib/ai/schemas';

interface Props {
  applicationId: string;
  initialData?: Partial<NoticeData>;
  isEditable: boolean;
  caseNo: string;
  applicantName: string;
  mauza: string;
  khataNo: string;
  khesraNo: string;
  areaDecimal: number;
}

export function NoticeStep({
  applicationId,
  initialData,
  isEditable,
  caseNo,
  applicantName,
  mauza,
  khataNo,
  khesraNo,
  areaDecimal,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [generalNoticeIssuedOn, setGeneralNoticeIssuedOn] = useState<string>(
    initialData?.generalNoticeIssuedOn ?? ''
  );
  const [objectionDeadline, setObjectionDeadline] = useState<string>(
    initialData?.objectionDeadline ?? ''
  );
  const [specificParties, setSpecificParties] = useState<NoticeParty[]>(
    initialData?.specificNoticeParties ?? []
  );
  const [objections, setObjections] = useState<Objection[]>(
    initialData?.objections ?? []
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  // Form inputs for adding a party manually
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyRelation, setNewPartyRelation] = useState('');

  // Form inputs for adding an objection
  const [newObjector, setNewObjector] = useState('');
  const [newObjectionText, setNewObjectionText] = useState('');
  const [newReceivedOn, setNewReceivedOn] = useState('');

  const handleAddParty = (nameToAdd?: string, relToAdd?: string) => {
    const finalName = (nameToAdd || newPartyName).trim();
    const finalRel = (relToAdd || newPartyRelation).trim();
    if (!finalName || !finalRel) return;

    setSpecificParties((prev) => [
      ...prev,
      { name: finalName, relation: finalRel },
    ]);

    if (!nameToAdd) {
      setNewPartyName('');
      setNewPartyRelation('');
    }
  };

  const handleRemoveParty = (index: number) => {
    setSpecificParties(specificParties.filter((_, i) => i !== index));
  };

  const handleAddObjection = () => {
    if (!newObjector.trim() || !newObjectionText.trim()) return;
    setObjections([
      ...objections,
      {
        by: newObjector.trim(),
        text: newObjectionText.trim(),
        receivedOn: newReceivedOn || new Date().toISOString().split('T')[0],
      },
    ]);
    setNewObjector('');
    setNewObjectionText('');
    setNewReceivedOn('');
  };

  const handleRemoveObjection = (index: number) => {
    setObjections(objections.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await saveStepData(
        applicationId,
        'NOTICE_OBJECTION',
        {
          generalNoticeIssuedOn: generalNoticeIssuedOn || null,
          objectionDeadline: objectionDeadline || null,
          specificNoticeParties: specificParties,
          objections,
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

  const deadlineDisplay = objectionDeadline || '__________';

  return (
    <div className="space-y-6">
      {/* Notice Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            {hi.stepForms.notice.generalNoticeDate}
          </label>
          <input
            type="date"
            disabled={!isEditable}
            value={generalNoticeIssuedOn}
            onChange={(e) => setGeneralNoticeIssuedOn(e.target.value)}
            className="w-full min-h-[44px] px-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            {hi.stepForms.notice.objectionDeadline}
          </label>
          <input
            type="date"
            disabled={!isEditable}
            value={objectionDeadline}
            onChange={(e) => setObjectionDeadline(e.target.value)}
            className="w-full min-h-[44px] px-3 border border-zinc-300 rounded-lg text-base text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500"
          />
        </div>
      </div>

      {/* Statutory Form-XI Notice Template preview */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
        <h4 className="text-sm font-bold text-zinc-800">
          {hi.stepForms.notice.formXiTitle}
        </h4>
        <div className="p-3 bg-white border border-zinc-200 rounded text-sm text-zinc-800 whitespace-pre-line leading-relaxed font-sans">
          {hi.stepForms.notice.renderFormXi({
            caseNo,
            applicantName,
            mauza,
            khataNo,
            khesraNo,
            areaDecimal,
            deadline: deadlineDisplay,
          })}
        </div>
      </div>

      {/* AI Suggestion Panel for identifying specific notice parties */}
      <AiSuggestionPanel
        buttonLabel={hi.ai.noticeButton}
        isEditable={isEditable}
        onRequest={() =>
          requestSuggestion(applicationId, 'NOTICE_OBJECTION', 'NOTICE_PARTIES')
        }
        onApply={(rawOutput, sugId) => {
          const data = rawOutput as NoticePartiesOutput;
          setActiveSuggestionId(sugId);
          if (data.parties && data.parties.length > 0) {
            setSpecificParties((prev) => [
              ...prev,
              ...data.parties.map((p) => ({ name: p.name, relation: p.relation })),
            ]);
          }
        }}
        onDiscard={() => setActiveSuggestionId(null)}
        renderContent={(rawOutput) => {
          const data = rawOutput as NoticePartiesOutput;
          return (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-indigo-950">
                {hi.ai.suggestedParties}:
              </h4>
              <div className="space-y-2">
                {data.parties.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-indigo-100 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 text-sm">
                        {p.name}
                      </span>
                      <span className="text-indigo-900 ml-2">({p.relation})</span>
                      <p className="text-zinc-600 mt-0.5">{p.reasonHi}</p>
                    </div>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleAddParty(p.name, p.relation)}
                        className="min-h-[36px] px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                      >
                        + {hi.ai.addPartyButton}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }}
      />

      {/* Specific Notice Parties (Form-XII) */}
      <div className="space-y-3">
        <h4 className="text-base font-bold text-zinc-900">
          {hi.stepForms.notice.specificNoticeParties}
        </h4>

        {specificParties.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">
            {hi.stepForms.notice.noSpecificParties}
          </p>
        ) : (
          <div className="space-y-2">
            {specificParties.map((party, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-zinc-200 rounded-lg flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-zinc-900 text-sm">
                    {party.name}
                  </span>
                  <span className="text-xs text-zinc-500 ml-2">
                    ({party.relation})
                  </span>
                </div>
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveParty(idx)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold min-h-[36px] px-2"
                  >
                    {hi.stepForms.notice.removeParty}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditable && (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {hi.stepForms.notice.partyName}
                </label>
                <input
                  type="text"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full min-h-[44px] px-3 border border-zinc-300 rounded text-base text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {hi.stepForms.notice.partyRelation}
                </label>
                <input
                  type="text"
                  value={newPartyRelation}
                  onChange={(e) => setNewPartyRelation(e.target.value)}
                  className="w-full min-h-[44px] px-3 border border-zinc-300 rounded text-base text-zinc-900"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAddParty()}
              className="min-h-[44px] px-4 bg-zinc-700 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800"
            >
              + {hi.stepForms.notice.addParty}
            </button>
          </div>
        )}

        {/* Form-XII preview for registered parties */}
        {specificParties.length > 0 && (
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <h5 className="text-sm font-bold text-zinc-800">
              {hi.stepForms.notice.formXiiTitle}
            </h5>
            {specificParties.map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-zinc-200 rounded text-xs text-zinc-800 whitespace-pre-line leading-relaxed font-sans"
              >
                {hi.stepForms.notice.renderFormXii({
                  partyName: p.name,
                  partyRelation: p.relation,
                  caseNo,
                  applicantName,
                  mauza,
                  khataNo,
                  khesraNo,
                  areaDecimal,
                  deadline: deadlineDisplay,
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Objections List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-base font-bold text-zinc-900">
          {hi.stepForms.notice.objectionsTitle}
        </h4>

        {objections.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">
            {hi.stepForms.notice.noObjections}
          </p>
        ) : (
          <div className="space-y-2">
            {objections.map((obj, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-amber-950">
                    {obj.by}
                  </span>
                  <span className="text-xs text-amber-800">{obj.receivedOn}</span>
                </div>
                <p className="text-sm text-zinc-800 whitespace-pre-line">
                  {obj.text}
                </p>
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveObjection(idx)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold pt-1 min-h-[36px]"
                  >
                    {hi.stepForms.notice.removeObjection}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditable && (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {hi.stepForms.notice.objectorName}
                </label>
                <input
                  type="text"
                  value={newObjector}
                  onChange={(e) => setNewObjector(e.target.value)}
                  className="w-full min-h-[44px] px-3 border border-zinc-300 rounded text-base text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {hi.stepForms.notice.receivedOn}
                </label>
                <input
                  type="date"
                  value={newReceivedOn}
                  onChange={(e) => setNewReceivedOn(e.target.value)}
                  className="w-full min-h-[44px] px-3 border border-zinc-300 rounded text-base text-zinc-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {hi.stepForms.notice.objectionText}
              </label>
              <textarea
                rows={2}
                value={newObjectionText}
                onChange={(e) => setNewObjectionText(e.target.value)}
                className="w-full p-2.5 border border-zinc-300 rounded text-base text-zinc-900"
              />
            </div>
            <button
              type="button"
              onClick={handleAddObjection}
              className="min-h-[44px] px-4 bg-zinc-700 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800"
            >
              + {hi.stepForms.notice.addObjection}
            </button>
          </div>
        )}
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
