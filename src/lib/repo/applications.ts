// Application repository for fetching and calculating queue urgency metrics

import { createClient } from '@/lib/supabase/server';
import { urgency, type UrgencyResult } from '@/lib/workflow/sla';
import {
  type Role,
  type Step,
  type Status,
  STEP_OWNER,
} from '@/lib/workflow/types';

export interface ApplicationRow {
  id: string;
  case_no: string;
  applicant_name: string;
  applicant_phone: string | null;
  transaction_type: 'SALE' | 'INHERITANCE' | 'GIFT';
  mauza: string;
  khata_no: string;
  khesra_no: string;
  area_decimal: number;
  deed_no: string | null;
  deed_date: string | null;
  deed_text: string | null;
  received_on: string;
  due_on: string;
  current_step: Step;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithUrgency extends ApplicationRow {
  urgency: UrgencyResult;
}

export interface DashboardData {
  myWork: ApplicationWithUrgency[];
  otherPending: ApplicationWithUrgency[];
  disposed: ApplicationWithUrgency[];
  counts: {
    totalPending: number;
    myAction: number;
    overdue: number;
    dueSoon: number;
  };
}

/**
 * Sort comparator:
 * 1. OVERDUE first (earliest due date first)
 * 2. DUE_SOON second (earliest due date first)
 * 3. ON_TRACK third (earliest due date first)
 */
function compareUrgency(a: ApplicationWithUrgency, b: ApplicationWithUrgency): number {
  const rank: Record<UrgencyResult['level'], number> = {
    OVERDUE: 0,
    DUE_SOON: 1,
    ON_TRACK: 2,
  };

  const rankDiff = rank[a.urgency.level] - rank[b.urgency.level];
  if (rankDiff !== 0) return rankDiff;

  // Secondary sort by due_on date string (ISO YYYY-MM-DD sorts alphabetically)
  return a.due_on.localeCompare(b.due_on);
}

export async function getDashboardData(
  userRole: Role,
  stepFilter?: Step
): Promise<DashboardData> {
  const supabase = await createClient();

  let query = supabase.from('applications').select('*');

  if (stepFilter) {
    query = query.eq('current_step', stepFilter);
  }

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(`Failed to load applications: ${error?.message}`);
  }

  const allApps: ApplicationWithUrgency[] = (data as ApplicationRow[]).map((app) => ({
    ...app,
    urgency: urgency(app.due_on),
  }));

  const myWork: ApplicationWithUrgency[] = [];
  const otherPending: ApplicationWithUrgency[] = [];
  const disposed: ApplicationWithUrgency[] = [];

  let overdueCount = 0;
  let dueSoonCount = 0;

  for (const app of allApps) {
    if (app.status === 'IN_PROGRESS') {
      if (app.urgency.level === 'OVERDUE') overdueCount++;
      if (app.urgency.level === 'DUE_SOON') dueSoonCount++;

      if (STEP_OWNER[app.current_step] === userRole) {
        myWork.push(app);
      } else {
        otherPending.push(app);
      }
    } else {
      disposed.push(app);
    }
  }

  myWork.sort(compareUrgency);
  otherPending.sort(compareUrgency);
  disposed.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return {
    myWork,
    otherPending,
    disposed,
    counts: {
      totalPending: myWork.length + otherPending.length,
      myAction: myWork.length,
      overdue: overdueCount,
      dueSoon: dueSoonCount,
    },
  };
}

export async function getApplicationById(id: string): Promise<ApplicationWithUrgency | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const app = data as ApplicationRow;
  return {
    ...app,
    urgency: urgency(app.due_on),
  };
}
