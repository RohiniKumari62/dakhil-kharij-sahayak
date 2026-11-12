// Audit events repository with Indian Standard Time formatting

import { createClient } from '@/lib/supabase/server';
import type { Role, Step } from '@/lib/workflow/types';

export interface AuditEventWithActor {
  id: number;
  application_id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: Role | null;
  event_type: string;
  from_step: Step | null;
  to_step: Step | null;
  note: string | null;
  created_at: string;
  formatted_time_ist: string;
}

interface RawAuditEvent {
  id: number;
  application_id: string;
  actor_id: string | null;
  actor_role: Role | null;
  event_type: string;
  from_step: Step | null;
  to_step: Step | null;
  note: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

/**
 * Formats ISO timestamp to DD/MM/YYYY hh:mm A in Indian Standard Time (IST)
 */
export function formatIstDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export async function getAuditEvents(applicationId: string): Promise<AuditEventWithActor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_events')
    .select('*, profiles:actor_id (full_name)')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  const raw = data as unknown as RawAuditEvent[];

  return raw.map((item) => ({
    id: item.id,
    application_id: item.application_id,
    actor_id: item.actor_id,
    actor_name: item.profiles?.full_name || 'विभागीय प्रणाली',
    actor_role: item.actor_role,
    event_type: item.event_type,
    from_step: item.from_step,
    to_step: item.to_step,
    note: item.note,
    created_at: item.created_at,
    formatted_time_ist: formatIstDate(item.created_at),
  }));
}

export async function getStepRecords(
  applicationId: string
): Promise<Record<Step, { data: Record<string, unknown>; updated_at: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('step_records')
    .select('step, data, updated_at')
    .eq('application_id', applicationId);

  if (error || !data) {
    return {} as Record<Step, { data: Record<string, unknown>; updated_at: string }>;
  }

  const result = {} as Record<Step, { data: Record<string, unknown>; updated_at: string }>;

  for (const row of data) {
    result[row.step as Step] = {
      data: (row.data as Record<string, unknown>) || {},
      updated_at: row.updated_at,
    };
  }

  return result;
}
