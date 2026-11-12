import { hi } from '@/lib/i18n/hi';
import type { AuditEventWithActor } from '@/lib/repo/audit';

interface Props {
  events: AuditEventWithActor[];
}

export function Timeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="p-4 bg-white border border-zinc-200 rounded-xl text-center text-zinc-500 text-base">
        {hi.common.noData}
      </div>
    );
  }

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'RETURNED':
      case 'RETURNED_TO_APPLICANT':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'FORWARDED':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const getEventLabel = (eventType: string): string => {
    switch (eventType) {
      case 'CREATED':
        return 'आवेदन दर्ज';
      case 'FORWARDED':
        return hi.decisions.FORWARD;
      case 'RETURNED':
        return hi.decisions.RETURN;
      case 'RETURNED_TO_APPLICANT':
        return hi.statuses.RETURNED_TO_APPLICANT;
      case 'APPROVED':
        return hi.decisions.APPROVE;
      case 'REJECTED':
        return hi.decisions.REJECT;
      case 'AI_SUGGESTION_USED':
        return 'AI सुझाव प्रयुक्त';
      case 'NOTE_SAVED':
        return 'टिप्पणी सहेजी गई';
      default:
        return eventType;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
      <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2">
        {hi.caseDetail.historyTitle}
      </h2>

      <ol className="relative border-l border-zinc-200 ml-3 space-y-4">
        {events.map((evt) => {
          const roleLabel = evt.actor_role
            ? hi.roles[evt.actor_role] || evt.actor_role
            : '';
          const fromStepLabel = evt.from_step ? hi.steps[evt.from_step] : null;
          const toStepLabel = evt.to_step ? hi.steps[evt.to_step] : null;

          return (
            <li key={evt.id} className="ml-5 relative">
              <span className="absolute -left-7 top-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white ring-2 ring-blue-100" />

              <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getEventBadge(
                      evt.event_type
                    )}`}
                  >
                    {getEventLabel(evt.event_type)}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {evt.actor_name}
                  </span>
                  {roleLabel && (
                    <span className="text-xs text-zinc-500 font-medium">
                      ({roleLabel})
                    </span>
                  )}
                </div>

                <time className="text-xs text-zinc-500 font-mono">
                  {evt.formatted_time_ist}
                </time>
              </div>

              {fromStepLabel && toStepLabel && fromStepLabel !== toStepLabel && (
                <div className="text-xs text-zinc-600 mt-1 font-medium">
                  {fromStepLabel} &rarr; {toStepLabel}
                </div>
              )}

              {evt.note && (
                <div className="mt-1.5 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800">
                  <span className="font-semibold text-zinc-700 block text-xs mb-0.5">
                    {hi.caseDetail.noteLabel}:
                  </span>
                  {evt.note}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
