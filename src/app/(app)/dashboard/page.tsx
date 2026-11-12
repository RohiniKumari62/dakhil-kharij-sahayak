import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hi } from '@/lib/i18n/hi';
import { getDashboardData } from '@/lib/repo/applications';
import { ApplicationCard } from '@/components/ApplicationCard';
import { STEP_ORDER, type Role, type Step } from '@/lib/workflow/types';

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

export const metadata = {
  title: hi.dashboard.pageTitle,
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { step } = await searchParams;
  const stepFilter = STEP_ORDER.includes(step as Step) ? (step as Step) : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as Role) || 'halka_karamchari';
  const data = await getDashboardData(userRole, stepFilter);

  return (
    <div className="space-y-6">
      {/* 4 Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
          <div className="text-xs sm:text-sm font-medium text-zinc-600">
            {hi.dashboard.totalPending}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">
            {data.counts.totalPending}
          </div>
        </div>

        <div className="p-4 bg-white border border-blue-200 bg-blue-50/30 rounded-xl shadow-xs">
          <div className="text-xs sm:text-sm font-semibold text-blue-900">
            {hi.dashboard.myAction}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700 mt-1">
            {data.counts.myAction}
          </div>
        </div>

        <div className="p-4 bg-white border border-red-200 bg-red-50/30 rounded-xl shadow-xs">
          <div className="text-xs sm:text-sm font-semibold text-red-900">
            {hi.dashboard.overdue}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-700 mt-1">
            {data.counts.overdue}
          </div>
        </div>

        <div className="p-4 bg-white border border-amber-200 bg-amber-50/30 rounded-xl shadow-xs">
          <div className="text-xs sm:text-sm font-semibold text-amber-900">
            {hi.dashboard.dueSoon}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1">
            {data.counts.dueSoon}
          </div>
        </div>
      </div>

      {/* Filter by Step */}
      <div className="bg-white p-3 sm:p-4 border border-zinc-200 rounded-xl shadow-xs">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          {hi.dashboard.filterStepLabel}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg border flex items-center transition-colors focus:outline-2 focus:outline-blue-600 ${
              !stepFilter
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
            }`}
          >
            {hi.dashboard.filterAllSteps}
          </Link>
          {STEP_ORDER.map((s) => (
            <Link
              key={s}
              href={`/dashboard?step=${s}`}
              className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg border flex items-center transition-colors focus:outline-2 focus:outline-blue-600 ${
                stepFilter === s
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {hi.steps[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Section 1: मेरी कार्रवाई के लिए */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span>{hi.dashboard.sectionMyWork}</span>
            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              {data.myWork.length}
            </span>
          </h2>
        </div>

        {data.myWork.length === 0 ? (
          <div className="p-6 bg-white border border-zinc-200 rounded-xl text-center text-zinc-500 text-base">
            {hi.dashboard.emptyMyWork}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.myWork.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: अन्य लंबित */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span>{hi.dashboard.sectionOtherPending}</span>
            <span className="text-sm font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded-full">
              {data.otherPending.length}
            </span>
          </h2>
        </div>

        {data.otherPending.length === 0 ? (
          <div className="p-6 bg-white border border-zinc-200 rounded-xl text-center text-zinc-500 text-base">
            {hi.dashboard.emptyOtherPending}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.otherPending.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: निपटाए गए (Collapsed by default) */}
      <section>
        <details className="group bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          <summary className="min-h-[44px] px-4 py-3 cursor-pointer select-none flex items-center justify-between font-bold text-base sm:text-lg text-zinc-800 hover:bg-zinc-50 transition-colors">
            <span className="flex items-center gap-2">
              <span>{hi.dashboard.sectionDisposed}</span>
              <span className="text-sm font-normal text-zinc-500">
                ({data.disposed.length})
              </span>
            </span>
            <span className="text-sm text-zinc-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
            {data.disposed.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-base">
                {hi.dashboard.emptyDisposed}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {data.disposed.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            )}
          </div>
        </details>
      </section>
    </div>
  );
}
