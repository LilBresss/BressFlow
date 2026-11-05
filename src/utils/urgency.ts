import { Activity, TaskStatus, UrgencyInfo, UrgencyLevel } from '../types';

/**
 * Parses a date (YYYY-MM-DD) and time (HH:MM) into a local JavaScript Date object.
 */
export function parseDueDateTime(dueDate: string, dueTime: string): Date {
  const [yearStr, monthStr, dayStr] = dueDate.split('-');
  const [hourStr, minStr] = dueTime.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hours = parseInt(hourStr, 10) || 0;
  const minutes = parseInt(minStr, 10) || 0;

  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Calculates the exact urgency level based on the remaining milliseconds.
 *
 * Rules:
 * - Tempo rimanente <= 0: SCADUTA (level 5 flag isExpired = true)
 * - Meno di 48 ore: Livello 5 - Molto alta
 * - Da 48 ore a 7 giorni: Livello 4 - Alta
 * - Più di 7 e fino a 14 giorni: Livello 3 - Media
 * - Più di 14 e fino a 30 giorni: Livello 2 - Bassa
 * - Più di 30 giorni: Livello 1 - Molto bassa
 */
export function calculateUrgency(dueDate: string, dueTime: string, now: Date = new Date()): UrgencyInfo {
  const target = parseDueDateTime(dueDate, dueTime);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      level: 5,
      label: 'Molto alta',
      isExpired: true,
      colorClass: 'text-red-700 dark:text-red-400',
      badgeBg: 'bg-red-500/10 dark:bg-red-500/20',
      badgeText: 'text-red-700 dark:text-red-400',
      badgeBorder: 'border-red-400/30 dark:border-red-500/40',
    };
  }

  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const daysRemaining = hoursRemaining / 24;

  if (hoursRemaining < 48) {
    return {
      level: 5,
      label: 'Molto alta',
      isExpired: false,
      colorClass: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-300',
      badgeBorder: 'border-rose-400/30 dark:border-rose-500/40',
    };
  } else if (daysRemaining <= 7) {
    return {
      level: 4,
      label: 'Alta',
      isExpired: false,
      colorClass: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      badgeBorder: 'border-amber-400/30 dark:border-amber-500/40',
    };
  } else if (daysRemaining <= 14) {
    return {
      level: 3,
      label: 'Media',
      isExpired: false,
      colorClass: 'text-yellow-600 dark:text-yellow-400',
      badgeBg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
      badgeText: 'text-yellow-700 dark:text-yellow-300',
      badgeBorder: 'border-yellow-400/30 dark:border-yellow-500/40',
    };
  } else if (daysRemaining <= 30) {
    return {
      level: 2,
      label: 'Bassa',
      isExpired: false,
      colorClass: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20',
      badgeText: 'text-sky-700 dark:text-sky-300',
      badgeBorder: 'border-sky-400/30 dark:border-sky-500/40',
    };
  } else {
    return {
      level: 1,
      label: 'Molto bassa',
      isExpired: false,
      colorClass: 'text-slate-600 dark:text-slate-400',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300',
      badgeBorder: 'border-slate-300/40 dark:border-slate-700/60',
    };
  }
}

/**
 * Calculates countdown string.
 * Example: "2 settimane, 3 giorni, 5 ore e 24 minuti"
 * If < 24h, isUnder24Hours = true
 * If expired, returns isExpired = true, formatted = "SCADUTA"
 */
export function calculateCountdown(dueDate: string, dueTime: string, now: Date = new Date()): {
  formatted: string;
  isExpired: boolean;
  totalSeconds: number;
  isUnder24Hours: boolean;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
} {
  const target = parseDueDateTime(dueDate, dueTime);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      formatted: 'SCADUTA',
      isExpired: true,
      totalSeconds: 0,
      isUnder24Hours: false,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (weeks > 0) {
    parts.push(`${weeks} ${weeks === 1 ? 'settimana' : 'settimane'}`);
  }
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'giorno' : 'giorni'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'ora' : 'ore'}`);
  }
  // If we have days/weeks and 0 hours, we might still show minutes if needed or always show minutes
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`);
  }

  let formatted = '';
  if (parts.length === 1) {
    formatted = parts[0];
  } else if (parts.length === 2) {
    formatted = `${parts[0]} e ${parts[1]}`;
  } else {
    const last = parts[parts.length - 1];
    const initial = parts.slice(0, parts.length - 1).join(', ');
    formatted = `${initial} e ${last}`;
  }

  return {
    formatted,
    isExpired: false,
    totalSeconds,
    isUnder24Hours: totalHours < 24,
    weeks,
    days,
    hours,
    minutes,
  };
}

/**
 * Calculates estimated duration.
 * If activity has subtasks, sums subtask durations.
 * Otherwise uses activity.manualDurationMinutes.
 */
export function calculateDuration(activity: {
  manualDurationMinutes?: number;
  subtasks?: { durationMinutes: number }[];
}): { totalMinutes: number; formatted: string; hours: number; minutes: number } {
  let totalMinutes = 0;
  if (activity.subtasks && activity.subtasks.length > 0) {
    totalMinutes = activity.subtasks.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  } else {
    totalMinutes = Number(activity.manualDurationMinutes) || 0;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0 && minutes > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formatted = `${hours}h`;
  } else {
    formatted = `${minutes}m`;
  }

  return { totalMinutes, formatted, hours, minutes };
}

/**
 * Formats duration in descriptive Italian: "3 ore e 45 minuti" or "45 minuti"
 */
export function formatDurationDescriptive(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? 'ora' : 'ore'} e ${minutes} minuti`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'ora' : 'ore'}`;
  } else {
    return `${minutes} minuti`;
  }
}

/**
 * Calculates subtask progress.
 */
export function calculateSubtaskProgress(subtasks?: { status: TaskStatus }[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!subtasks || subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.status === 'COMPLETATA').length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

/**
 * Sorts activities per the brief's default ordering:
 * 1. Expired tasks first (earliest deadline first)
 * 2. Active tasks by closest deadline (ascending)
 * 3. Ties broken by highest urgency level
 */
export function sortActivities(activities: Activity[], now: Date = new Date()): Activity[] {
  return [...activities].sort((a, b) => {
    // Only sort incomplete tasks by urgency/deadline rules, completed tasks keep completedAt or dueDate
    if (a.status === 'COMPLETATA' && b.status === 'COMPLETATA') {
      return (b.completedAt || b.dueDate).localeCompare(a.completedAt || a.dueDate);
    }
    if (a.status === 'COMPLETATA') return 1;
    if (b.status === 'COMPLETATA') return -1;

    const timeA = parseDueDateTime(a.dueDate, a.dueTime).getTime();
    const timeB = parseDueDateTime(b.dueDate, b.dueTime).getTime();
    const nowMs = now.getTime();

    const isExpiredA = timeA <= nowMs;
    const isExpiredB = timeB <= nowMs;

    if (isExpiredA && !isExpiredB) return -1;
    if (!isExpiredA && isExpiredB) return 1;

    // Both expired: earliest first
    if (isExpiredA && isExpiredB) {
      return timeA - timeB;
    }

    // Both not expired: closest deadline first
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Tie-breaker: highest urgency level
    const urgA = calculateUrgency(a.dueDate, a.dueTime, now).level;
    const urgB = calculateUrgency(b.dueDate, b.dueTime, now).level;
    return urgB - urgA;
  });
}
