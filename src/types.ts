export type TaskStatus = 'DA FARE' | 'COMPLETATA';

export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: 'Molto bassa' | 'Bassa' | 'Media' | 'Alta' | 'Molto alta';
  isExpired: boolean;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number; // in minutes
  status: TaskStatus;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // hex color
  userId?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  subjectId?: string;
  status: TaskStatus;
  manualDurationMinutes: number;
  subtasks: Subtask[];
  parentActivityId?: string;
  googleEventId?: string;
  googleCalendarId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AppNotification {
  id: string;
  activityId: string;
  activityTitle: string;
  type: '24h' | '1h' | 'expired';
  message: string;
  dueDateTime: string;
  timestamp: string;
  read: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '24h' | '12h';
  inAppNotifications: boolean;
  pushNotifications: boolean;
  notify24h: boolean;
  notify1h: boolean;
  notifyExpired: boolean;
  syncGoogleCalendar: boolean;
  selectedCalendarId: string;
  syncSubtasks: boolean;
  lastSyncAt?: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
  description?: string;
  backgroundColor?: string;
}
