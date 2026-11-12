import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getApplicationById } from '@/lib/repo/applications';
import { getAuditEvents, getStepRecords } from '@/lib/repo/audit';
import { STEP_ORDER, STEP_OWNER, type Role, type Step } from '@/lib/workflow/types';
import { hi } from '@/lib/i18n/hi';
import { StepProgress } from '@/components/StepProgress';
import { Timeline } from '@/components/Timeline';
import { ScrutinyStep } from '@/components/steps/ScrutinyStep';
import { FieldEnquiryStep } from '@/components/steps/FieldEnquiryStep';
import { NoticeStep } from '@/components/steps/NoticeStep';
import { HearingStep } from '@/components/steps/HearingStep';
import { FinalOrderStep } from '@/components/steps/FinalOrderStep';
import { DecisionBar } from '@/components/DecisionBar';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as Role) || null;

  const application = await getApplicationById(id);
  if (!application) {
    notFound();
  }

  const [auditEvents, stepRecords] = await Promise.all([
    getAuditEvents(id),
    getStepRecords(id),
  ]);

  const currentStep = application.current_step;
  const isCaseClosed = application.status !== 'IN_PROGRESS';
  const ownerRole = STEP_OWNER[currentStep];
  const isOwner = userRole === ownerRole;
  const isEditable = !isCaseClosed && isOwner;

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  // Earlier steps are completed steps before currentIndex (or all completed if approved)
  const earlierSteps = STEP_ORDER.slice(
    0,
    application.status === 'APPROVED' ? 5 : currentIndex
  );

  let badgeClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  let badgeText = `${application.urgency.daysLeft} ${hi.common.daysUnit} ${hi.common.remainingSuffix}`;

  if (application.status !== 'IN_PROGRESS') {
    badgeClasses = 'bg-zinc-100 text-zinc-700 border-zinc-300';
    badgeText = hi.statuses[application.status] || application.status;
  } else if (application.urgency.level === 'OVERDUE') {
    badgeClasses = 'bg-red-100 text-red-900 border-red-300 ring-1 ring-red-400';
    badgeText = `${Math.abs(application.urgency.daysLeft)} ${hi.common.daysUnit} ${hi.common.overdueSuffix}`;
  } else if (application.urgency.level === 'DUE_SOON') {
    badgeClasses = 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400';
    badgeText = `${application.urgency.daysLeft} ${hi.common.daysUnit} ${hi.common.remainingSuffix}`;
  }

  const renderStepForm = (step: Step, editable: boolean) => {
    const initialData = stepRecords[step]?.data;

    switch (step) {
      case 'SCRUTINY':
        return (
          <ScrutinyStep
            applicationId={id}
            initialData={initialData}
            deedText={application.deed_text}
            deedDate={application.deed_date}
            receivedOn={application.received_on}
            isEditable={editable}
          />
        );
      case 'FIELD_ENQUIRY':
        return (
          <FieldEnquiryStep
            applicationId={id}
            initialData={initialData}
            isEditable={editable}
          />
        );
      case 'NOTICE_OBJECTION':
        return (
          <NoticeStep
            applicationId={id}
            initialData={initialData}
            isEditable={editable}
            caseNo={application.case_no}
            applicantName={application.applicant_name}
            mauza={application.mauza}
            khataNo={application.khata_no}
            khesraNo={application.khesra_no}
            areaDecimal={application.area_decimal}
          />
        );
      case 'HEARING_RECOMMENDATION':
        return (
          <HearingStep
            applicationId={id}
            initialData={initialData}
            isEditable={editable}
          />
        );
      case 'FINAL_ORDER':
        return (
          <FinalOrderStep
            applicationId={id}
            initialData={initialData}
            isEditable={editable}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900 min-h-[44px] py-2"
        >
          &larr; {hi.caseDetail.backToDashboard}
        </Link>
      </div>

      {/* 1. Summary Header Card */}
      <section
        aria-label={hi.caseDetail.headerTitle}
        className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                {hi.caseDetail.transactionType}: {hi.caseDetail.types[application.transaction_type]}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClasses}`}
              >
                {badgeText}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mt-2 font-mono">
              {application.case_no}
            </h1>
            <p className="text-base text-zinc-700 font-semibold mt-1">
              {application.applicant_name}
              {application.applicant_phone && (
                <span className="text-sm font-normal text-zinc-500 ml-2 font-mono">
                  ({application.applicant_phone})
                </span>
              )}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-zinc-600 space-y-1 bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
            <div>
              <span className="font-medium text-zinc-500">{hi.caseDetail.receivedOn}: </span>
              <span className="font-mono text-zinc-800">{application.received_on}</span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">{hi.caseDetail.dueOn}: </span>
              <span className="font-mono font-bold text-zinc-900">{application.due_on}</span>
            </div>
          </div>
        </div>

        {/* Land & Deed Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-1">
          <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="block text-xs text-zinc-500">{hi.caseDetail.mauza}</span>
            <span className="font-bold text-zinc-900">{application.mauza}</span>
          </div>
          <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="block text-xs text-zinc-500">{hi.caseDetail.khata} / {hi.caseDetail.khesra}</span>
            <span className="font-bold text-zinc-900 font-mono">
              {application.khata_no} / {application.khesra_no}
            </span>
          </div>
          <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="block text-xs text-zinc-500">{hi.caseDetail.area}</span>
            <span className="font-bold text-zinc-900 font-mono">
              {application.area_decimal} {hi.common.decimalUnit}
            </span>
          </div>
          <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="block text-xs text-zinc-500">{hi.caseDetail.deedNo} ({hi.caseDetail.deedDate})</span>
            <span className="font-bold text-zinc-900 font-mono">
              {application.deed_no || '—'}{' '}
              {application.deed_date ? `(${application.deed_date})` : ''}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Step Progress Bar */}
      <StepProgress currentStep={application.current_step} status={application.status} />

      {/* 3. Current Step Form */}
      <section
        aria-label={hi.caseDetail.currentStepHeading}
        className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 pb-3">
          <h2 className="text-lg font-bold text-zinc-900">
            {hi.caseDetail.currentStepHeading}: {hi.steps[currentStep]}
          </h2>
          <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-900 rounded-full font-semibold border border-blue-200 self-start sm:self-auto">
            {hi.roles[ownerRole]}
          </span>
        </div>

        {/* Ownership banner when user cannot edit */}
        {isCaseClosed ? (
          <div
            role="status"
            className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-zinc-800 text-sm font-semibold"
          >
            {hi.caseDetail.closedMessage}
          </div>
        ) : !isOwner ? (
          <div
            role="alert"
            className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm font-semibold flex items-center gap-2"
          >
            <span>ℹ</span>
            <span>
              {hi.caseDetail.activeStepOwnerPrefix} {hi.roles[ownerRole]} {hi.caseDetail.activeStepOwnerSuffix}
            </span>
          </div>
        ) : null}

        {renderStepForm(currentStep, isEditable)}

        {/* Decision Bar for permitted role decisions */}
        {userRole && (
          <div className="pt-4 border-t border-zinc-200">
            <DecisionBar
              applicationId={id}
              currentStep={application.current_step}
              status={application.status}
              userRole={userRole}
            />
          </div>
        )}
      </section>

      {/* 4. Earlier Steps as Read-Only Accordions */}
      {earlierSteps.length > 0 && (
        <section aria-label={hi.caseDetail.earlierStepTitle} className="space-y-3">
          <h3 className="text-base font-bold text-zinc-800">
            {hi.caseDetail.earlierStepTitle}
          </h3>

          <div className="space-y-2">
            {earlierSteps.map((prevStep) => (
              <details
                key={prevStep}
                className="group bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs"
              >
                <summary className="p-4 cursor-pointer font-bold text-zinc-800 flex items-center justify-between hover:bg-zinc-50 min-h-[44px]">
                  <span>{hi.steps[prevStep]}</span>
                  <span className="text-xs text-blue-600 font-semibold group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="p-4 border-t border-zinc-100 bg-zinc-50">
                  {renderStepForm(prevStep, false)}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 5. Timeline from audit_events */}
      <section aria-label={hi.caseDetail.historyTitle}>
        <Timeline events={auditEvents} />
      </section>
    </div>
  );
}
