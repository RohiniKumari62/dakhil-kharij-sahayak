import Link from 'next/link';
import { hi } from '@/lib/i18n/hi';
import type { ApplicationWithUrgency } from '@/lib/repo/applications';

interface Props {
  app: ApplicationWithUrgency;
}

export function ApplicationCard({ app }: Props) {
  const stepName = hi.steps[app.current_step] || app.current_step;
  const statusName = hi.statuses[app.status] || app.status;

  // Urgency badge with dual visual encoding (colour AND explicit Hindi text)
  let badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let badgeText = `${app.urgency.daysLeft} ${hi.common.daysUnit} ${hi.common.remainingSuffix}`;

  if (app.status !== 'IN_PROGRESS') {
    badgeClasses = 'bg-zinc-100 text-zinc-700 border-zinc-300';
    badgeText = statusName;
  } else if (app.urgency.level === 'OVERDUE') {
    badgeClasses = 'bg-red-50 text-red-800 border-red-300';
    badgeText = `${Math.abs(app.urgency.daysLeft)} ${hi.common.daysUnit} ${hi.common.overdueSuffix}`;
  } else if (app.urgency.level === 'DUE_SOON') {
    badgeClasses = 'bg-amber-50 text-amber-900 border-amber-300';
    badgeText = `${app.urgency.daysLeft} ${hi.common.daysUnit} ${hi.common.remainingSuffix}`;
  }

  return (
    <Link
      href={`/applications/${app.id}`}
      className="block p-4 bg-white border border-zinc-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-md transition-all focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 min-h-[44px]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-sm sm:text-base font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
          {app.case_no}
        </span>
        <span
          className={`inline-flex items-center text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full border ${badgeClasses}`}
        >
          {badgeText}
        </span>
      </div>

      <div className="mt-2">
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 line-clamp-1">
          {app.applicant_name}
        </h3>
        <p className="text-sm text-zinc-600 mt-0.5">
          {hi.dashboard.mauza}:{' '}
          <span className="font-medium text-zinc-800">{app.mauza}</span>
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          {hi.dashboard.khataKhesra}:{' '}
          <span className="font-medium text-zinc-700">
            {app.khata_no} / {app.khesra_no}
          </span>{' '}
          ({app.area_decimal} {hi.common.decimalUnit})
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <span className="inline-flex items-center text-xs sm:text-sm font-medium px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
          {stepName}
        </span>
        <span className="text-xs sm:text-sm text-blue-700 font-semibold flex items-center gap-1">
          {hi.dashboard.openCase} &rarr;
        </span>
      </div>
    </Link>
  );
}
