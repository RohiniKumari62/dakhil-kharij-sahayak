// SLA and deadline calculation utilities for land mutation processing

export type UrgencyLevel = 'OVERDUE' | 'DUE_SOON' | 'ON_TRACK';

export interface UrgencyResult {
  level: UrgencyLevel;
  daysLeft: number;
}

export const REGISTRATION_DELAY_LIMIT_DAYS = 90;
export const DUE_SOON_THRESHOLD_WORKING_DAYS = 5;

/**
 * Normalizes input date string or Date object into a pure UTC date at midnight
 */
function parseDateOnly(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }
  const parts = input.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function formatDateIso(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds n working days to a date, skipping Saturdays (6) and Sundays (0).
 */
export function addWorkingDays(date: string | Date, n: number): string {
  const current = parseDateOnly(date);

  let added = 0;
  while (added < n) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dayOfWeek = current.getUTCDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  return formatDateIso(current);
}

/**
 * Computes due date by adding slaDays working days to receivedOn date.
 */
export function dueDate(receivedOn: string | Date, slaDays: number): string {
  return addWorkingDays(receivedOn, slaDays);
}

/**
 * Calculates working days between two dates.
 * If toDate < fromDate, returns a negative count of working days.
 */
export function workingDaysBetween(fromDate: string | Date, toDate: string | Date): number {
  const start = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);

  if (start.getTime() === end.getTime()) {
    return 0;
  }

  const isForward = end.getTime() > start.getTime();
  const step = isForward ? 1 : -1;
  const cursor = new Date(start.getTime());

  let workingDays = 0;
  while (cursor.getTime() !== end.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + step);
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays += step;
    }
  }

  return workingDays;
}

/**
 * Determines urgency level:
 * - OVERDUE: dueOn < today (daysLeft < 0)
 * - DUE_SOON: 0 <= daysLeft <= 5 working days
 * - ON_TRACK: daysLeft > 5 working days
 */
export function urgency(dueOn: string | Date, today: string | Date = new Date()): UrgencyResult {
  const due = parseDateOnly(dueOn);
  const current = parseDateOnly(today);

  const daysLeft = workingDaysBetween(current, due);

  if (daysLeft < 0) {
    return { level: 'OVERDUE', daysLeft };
  }

  if (daysLeft <= DUE_SOON_THRESHOLD_WORKING_DAYS) {
    return { level: 'DUE_SOON', daysLeft };
  }

  return { level: 'ON_TRACK', daysLeft };
}

/**
 * Difference in calendar days between deed registration date and application received date.
 */
export function registrationDelayDays(deedDate: string | Date, receivedOn: string | Date): number {
  const deed = parseDateOnly(deedDate);
  const received = parseDateOnly(receivedOn);

  const diffMs = received.getTime() - deed.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks whether the registration delay exceeds statutory limit (90 days).
 */
export function isBeyondLimit(days: number): boolean {
  return days > REGISTRATION_DELAY_LIMIT_DAYS;
}
