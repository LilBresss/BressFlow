import { Activity, GoogleCalendarItem } from '../types';
import { calculateDuration } from '../utils/urgency';

export interface CalendarSyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

/**
 * Lists user's Google Calendars with write access
 */
export async function fetchGoogleCalendars(accessToken: string): Promise<GoogleCalendarItem[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore recupero calendari Google: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const items = (data.items || []) as any[];

  // Filter calendars where user has writer or owner role
  const usable = items
    .filter((cal) => cal.accessRole === 'writer' || cal.accessRole === 'owner')
    .map((cal) => ({
      id: cal.id,
      summary: cal.summary || 'Calendario',
      primary: Boolean(cal.primary),
      description: cal.description,
      backgroundColor: cal.backgroundColor,
    }));

  return usable;
}

/**
 * Creates or updates an event in Google Calendar for a BressFlow activity.
 * Deadline is represented with dedicated end time at dueDateTime, start 15-30m prior or matching duration,
 * without blocking off uncommitted work hours unnecessarily.
 */
export async function syncActivityToGoogleCalendar(
  accessToken: string,
  calendarId: string,
  activity: Activity,
  subjectName?: string,
  syncSubtasks: boolean = false
): Promise<{ eventId: string }> {
  const [yearStr, monthStr, dayStr] = activity.dueDate.split('-');
  const [hourStr, minStr] = activity.dueTime.split(':');

  const endDateTime = new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10),
    parseInt(hourStr, 10),
    parseInt(minStr, 10),
    0
  );

  // Set start time 30 mins before deadline to mark the deadline block cleanly
  const startDateTime = new Date(endDateTime.getTime() - 30 * 60 * 1000);

  const durationInfo = calculateDuration(activity);
  let descriptionLines: string[] = [];

  if (activity.description) {
    descriptionLines.push(activity.description);
    descriptionLines.push('');
  }

  if (subjectName) {
    descriptionLines.push(`Materia: ${subjectName}`);
  }

  descriptionLines.push(`Stato: ${activity.status}`);
  if (durationInfo.totalMinutes > 0) {
    descriptionLines.push(`Durata stimata: ${durationInfo.formatted}`);
  }

  if (syncSubtasks && activity.subtasks && activity.subtasks.length > 0) {
    descriptionLines.push('');
    descriptionLines.push('Sottoattività:');
    activity.subtasks.forEach((s) => {
      const check = s.status === 'COMPLETATA' ? '[✓]' : '[ ]';
      const dur = s.durationMinutes > 0 ? ` (${s.durationMinutes}m)` : '';
      descriptionLines.push(`${check} ${s.title}${dur}`);
    });
  }

  descriptionLines.push('');
  descriptionLines.push('Creato con BressFlow');

  const summary =
    activity.status === 'COMPLETATA'
      ? `✓ [Completata] ${activity.title}`
      : `Scadenza: ${activity.title}`;

  const eventPayload = {
    summary,
    description: descriptionLines.join('\n'),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 24 hours
        { method: 'popup', minutes: 60 }, // 1 hour
      ],
    },
  };

  const calIdEncoded = encodeURIComponent(calendarId || 'primary');

  if (activity.googleEventId) {
    // Update existing event
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calIdEncoded}/events/${encodeURIComponent(
      activity.googleEventId
    )}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (res.ok) {
      const eventData = await res.json();
      return { eventId: eventData.id };
    } else if (res.status === 404) {
      // Event might have been deleted from Google Calendar, re-create it
      return await createNewEvent(accessToken, calIdEncoded, eventPayload);
    } else {
      const err = await res.text();
      throw new Error(`Impossibile aggiornare evento su Google Calendar: ${res.status} - ${err}`);
    }
  } else {
    return await createNewEvent(accessToken, calIdEncoded, eventPayload);
  }
}

async function createNewEvent(
  accessToken: string,
  calIdEncoded: string,
  eventPayload: any
): Promise<{ eventId: string }> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calIdEncoded}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Impossibile creare evento su Google Calendar: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return { eventId: data.id };
}

/**
 * Deletes an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calIdEncoded = encodeURIComponent(calendarId || 'primary');
  const eventIdEncoded = encodeURIComponent(eventId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calIdEncoded}/events/${eventIdEncoded}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    console.warn(`Could not delete Google Calendar event: ${err}`);
  }
}
