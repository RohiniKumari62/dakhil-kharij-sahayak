import { STEP_ORDER, type Step, type Status } from '@/lib/workflow/types';
import { hi } from '@/lib/i18n/hi';

interface Props {
  currentStep: Step;
  status: Status;
}

export function StepProgress({ currentStep, status }: Props) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200 shadow-xs">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
        {hi.caseDetail.stepProgress}
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {STEP_ORDER.map((step, idx) => {
          const isPast =
            status === 'APPROVED' || (status === 'IN_PROGRESS' && idx < currentIndex);
          const isCurrent = status === 'IN_PROGRESS' && idx === currentIndex;
          const isRejected = status === 'REJECTED' && idx === currentIndex;
          const stepName = hi.steps[step];

          let dotClass = 'bg-zinc-200 text-zinc-600 border-zinc-300';
          let textClass = 'text-zinc-500';

          if (isPast) {
            dotClass = 'bg-emerald-600 text-white border-emerald-600';
            textClass = 'text-emerald-900 font-medium';
          } else if (isCurrent) {
            dotClass = 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200';
            textClass = 'text-blue-900 font-bold';
          } else if (isRejected) {
            dotClass = 'bg-red-600 text-white border-red-600 ring-2 ring-red-200';
            textClass = 'text-red-900 font-bold';
          }

          return (
            <div key={step} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border transition-colors ${dotClass}`}
              >
                {isPast ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-1.5 leading-tight line-clamp-2 ${textClass}`}
              >
                {stepName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
