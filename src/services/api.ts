import { Activity, AppNotification, Subject, UserSettings } from '../types';

export interface UserDataResponse {
  activities: Activity[];
  subjects: Subject[];
  settings: UserSettings;
  notifications: AppNotification[];
}

export async function fetchUserData(userId: string): Promise<UserDataResponse> {
  const res = await fetch(`/api/user-data?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error('Errore durante il caricamento dei dati utente');
  }
  return await res.json();
}

export async function saveActivityApi(
  activity: Partial<Activity>,
  userId: string
): Promise<Activity> {
  const res = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activity, userId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore salvataggio attività');
  }
  const data = await res.json();
  return data.activity;
}

export async function toggleActivityStatusApi(
  id: string,
  completeSubtasks?: boolean
): Promise<Activity> {
  const res = await fetch(`/api/activities/${encodeURIComponent(id)}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completeSubtasks }),
  });
  if (!res.ok) {
    throw new Error('Errore cambio stato attività');
  }
  const data = await res.json();
  return data.activity;
}

export async function deleteActivityApi(id: string): Promise<void> {
  const res = await fetch(`/api/activities/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Errore eliminazione attività');
  }
}

export async function saveSubjectApi(subject: Partial<Subject>, userId: string): Promise<Subject> {
  const res = await fetch('/api/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, userId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore salvataggio materia');
  }
  const data = await res.json();
  return data.subject;
}

export async function deleteSubjectApi(
  id: string,
  action: 'unassign' | 'delete_tasks'
): Promise<void> {
  const res = await fetch(`/api/subjects/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    throw new Error('Errore eliminazione materia');
  }
}

export async function saveSettingsApi(
  settings: Partial<UserSettings>,
  userId: string
): Promise<UserSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings, userId }),
  });
  if (!res.ok) {
    throw new Error('Errore salvataggio impostazioni');
  }
  const data = await res.json();
  return data.settings;
}

export async function markNotificationsReadApi(
  notificationIds?: string[],
  all?: boolean,
  userId?: string
): Promise<void> {
  await fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds, all, userId }),
  });
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch('/api/vapid-public-key');
  if (!res.ok) throw new Error('Could not fetch VAPID key');
  const data = await res.json();
  return data.publicKey;
}

export async function registerPushSubscription(subscription: any, userId: string): Promise<void> {
  await fetch('/api/push-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, userId }),
  });
}

export async function testPushApi(userId: string): Promise<void> {
  await fetch('/api/test-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}
