import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { Activity, AppNotification, Subject, UserSettings } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'bressflow_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate or load VAPID keys for Web Push
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
let vapidKeys: { publicKey: string; privateKey: string };

if (fs.existsSync(VAPID_FILE)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  } catch {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
  }
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}

webpush.setVapidDetails(
  'mailto:support@bressflow.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

interface DatabaseSchema {
  users: Record<string, { id: string; email: string; name: string; avatar?: string }>;
  activities: Activity[];
  subjects: Subject[];
  settings: Record<string, UserSettings>;
  notifications: AppNotification[];
  sentAlerts: Record<string, boolean>; // key: `${activityId}_${type}`
  pushSubscriptions: Record<string, webpush.PushSubscription[]>;
}

// Default initial subjects as requested in brief section 7
const DEFAULT_SUBJECTS: Omit<Subject, 'id' | 'userId' | 'createdAt'>[] = [
  { name: 'Matematica', color: '#3b82f6' }, // Blu
  { name: 'Italiano', color: '#ef4444' }, // Rosso
  { name: 'Inglese', color: '#10b981' }, // Verde
  { name: 'Storia', color: '#f97316' }, // Arancione
  { name: 'Informatica', color: '#8b5cf6' }, // Viola
];

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  inAppNotifications: true,
  pushNotifications: false,
  notify24h: true,
  notify1h: true,
  notifyExpired: true,
  syncGoogleCalendar: false,
  selectedCalendarId: 'primary',
  syncSubtasks: false,
};

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading db file, resetting cache:', e);
    }
  }

  const initialDb: DatabaseSchema = {
    users: {},
    activities: [],
    subjects: [],
    settings: {},
    notifications: [],
    sentAlerts: {},
    pushSubscriptions: {},
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

let db = loadDatabase();

// Ensure demo user or newly authenticated users have their default subjects
function ensureUserInitialized(userId: string) {
  const userSubjects = db.subjects.filter((s) => s.userId === userId);
  if (userSubjects.length === 0) {
    const now = new Date().toISOString();
    DEFAULT_SUBJECTS.forEach((sub, idx) => {
      db.subjects.push({
        id: `subj_${userId}_${idx}_${Date.now()}`,
        userId,
        name: sub.name,
        color: sub.color,
        createdAt: now,
      });
    });
    saveDatabase(db);
  }

  if (!db.settings[userId]) {
    db.settings[userId] = { ...DEFAULT_SETTINGS };
    saveDatabase(db);
  }
}

// Background scheduler for notifications
function runNotificationScheduler() {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    let hasChanges = false;

    for (const activity of db.activities) {
      // Only process DA FARE activities
      if (activity.status !== 'DA FARE') {
        continue;
      }

      const [year, month, day] = activity.dueDate.split('-').map(Number);
      const [hour, minute] = activity.dueTime.split(':').map(Number);
      const targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      const diffMs = targetDate.getTime() - nowMs;
      const hoursRemaining = diffMs / (1000 * 60 * 60);

      const userSettings = (activity.userId && db.settings[activity.userId]) || DEFAULT_SETTINGS;

      // 1. Check 24 hours notification (between 1h and 24h)
      const key24h = `${activity.id}_24h`;
      if (hoursRemaining <= 24 && hoursRemaining > 1 && !db.sentAlerts[key24h] && userSettings.notify24h) {
        db.sentAlerts[key24h] = true;
        hasChanges = true;

        const notif: AppNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          activityId: activity.id,
          activityTitle: activity.title,
          type: '24h',
          message: `Mancano meno di 24 ore alla consegna dell'attività "${activity.title}".`,
          dueDateTime: `${activity.dueDate} ${activity.dueTime}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        db.notifications.unshift(notif);

        // Send Push Notification if user subscribed
        if (activity.userId && userSettings.pushNotifications) {
          sendPushToUser(activity.userId, {
            title: 'Scadenza tra 24 ore: ' + activity.title,
            body: `Consegna prevista: ${activity.dueDate} alle ${activity.dueTime}`,
            data: { url: `/` },
          });
        }
      }

      // 2. Check 1 hour notification (between 0h and 1h)
      const key1h = `${activity.id}_1h`;
      if (hoursRemaining <= 1 && hoursRemaining > 0 && !db.sentAlerts[key1h] && userSettings.notify1h) {
        db.sentAlerts[key1h] = true;
        hasChanges = true;

        const notif: AppNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          activityId: activity.id,
          activityTitle: activity.title,
          type: '1h',
          message: `Attenzione: manca meno di un'ora alla consegna dell'attività "${activity.title}".`,
          dueDateTime: `${activity.dueDate} ${activity.dueTime}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        db.notifications.unshift(notif);

        if (activity.userId && userSettings.pushNotifications) {
          sendPushToUser(activity.userId, {
            title: 'Scadenza tra 1 ORA: ' + activity.title,
            body: `Consegna urgente entro le ${activity.dueTime}!`,
            data: { url: `/` },
          });
        }
      }

      // 3. Check Expired notification (diffMs <= 0)
      const keyExpired = `${activity.id}_expired`;
      if (diffMs <= 0 && !db.sentAlerts[keyExpired] && userSettings.notifyExpired) {
        db.sentAlerts[keyExpired] = true;
        hasChanges = true;

        const notif: AppNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          activityId: activity.id,
          activityTitle: activity.title,
          type: 'expired',
          message: `L'attività "${activity.title}" è appena SCADUTA.`,
          dueDateTime: `${activity.dueDate} ${activity.dueTime}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        db.notifications.unshift(notif);

        if (activity.userId && userSettings.pushNotifications) {
          sendPushToUser(activity.userId, {
            title: 'ATTIVITÀ SCADUTA: ' + activity.title,
            body: `Il termine di consegna (${activity.dueDate} ${activity.dueTime}) è stato superato.`,
            data: { url: `/` },
          });
        }
      }
    }

    if (hasChanges) {
      saveDatabase(db);
    }
  } catch (err) {
    console.error('Error in notification scheduler:', err);
  }
}

// Run scheduler every 20 seconds
setInterval(runNotificationScheduler, 20000);

async function sendPushToUser(userId: string, payload: { title: string; body: string; data?: any }) {
  const subs = db.pushSubscriptions[userId] || [];
  if (subs.length === 0) return;

  const validSubs: webpush.PushSubscription[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      validSubs.push(sub);
    } catch (err: any) {
      // 404 or 410 means subscription expired/revoked
      if (err.statusCode !== 404 && err.statusCode !== 410) {
        validSubs.push(sub);
      }
    }
  }

  if (validSubs.length !== subs.length) {
    db.pushSubscriptions[userId] = validSubs;
    saveDatabase(db);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Public VAPID key
  app.get('/api/vapid-public-key', (req: Request, res: Response) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // Get all user data
  app.get('/api/user-data', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'default_user';
    ensureUserInitialized(userId);

    const activities = db.activities.filter((a) => (a.userId || 'default_user') === userId);
    const subjects = db.subjects.filter((s) => (s.userId || 'default_user') === userId);
    const settings = db.settings[userId] || DEFAULT_SETTINGS;
    const notifications = db.notifications.filter((n) => {
      const act = db.activities.find((a) => a.id === n.activityId);
      return !act || (act.userId || 'default_user') === userId;
    });

    res.json({
      activities,
      subjects,
      settings,
      notifications,
    });
  });

  // Create or Update Activity
  app.post('/api/activities', (req: Request, res: Response) => {
    const { activity, userId } = req.body;
    if (!activity || !activity.title || !activity.dueDate || !activity.dueTime) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti: titolo, data e ora di consegna' });
    }

    const uId = userId || activity.userId || 'default_user';
    ensureUserInitialized(uId);

    const existingIndex = db.activities.findIndex((a) => a.id === activity.id);
    const updatedActivity: Activity = {
      ...activity,
      userId: uId,
      status: activity.status || 'DA FARE',
      manualDurationMinutes: Number(activity.manualDurationMinutes) || 0,
      subtasks: activity.subtasks || [],
      createdAt: activity.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // If dueDate or dueTime changed, reset sent alerts for future trigger
      const old = db.activities[existingIndex];
      if (old.dueDate !== updatedActivity.dueDate || old.dueTime !== updatedActivity.dueTime) {
        delete db.sentAlerts[`${updatedActivity.id}_24h`];
        delete db.sentAlerts[`${updatedActivity.id}_1h`];
        delete db.sentAlerts[`${updatedActivity.id}_expired`];
      }
      db.activities[existingIndex] = updatedActivity;
    } else {
      db.activities.unshift(updatedActivity);
    }

    saveDatabase(db);
    res.json({ success: true, activity: updatedActivity });
  });

  // Toggle status (DA FARE <-> COMPLETATA)
  app.post('/api/activities/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const { completeSubtasks } = req.body;
    const activity = db.activities.find((a) => a.id === id);

    if (!activity) {
      return res.status(404).json({ error: 'Attività non trovata' });
    }

    if (activity.status === 'DA FARE') {
      activity.status = 'COMPLETATA';
      activity.completedAt = new Date().toISOString();
      if (completeSubtasks && activity.subtasks) {
        activity.subtasks.forEach((s) => (s.status = 'COMPLETATA'));
      }
    } else {
      activity.status = 'DA FARE';
      delete activity.completedAt;
      // Reset sent alert flags if deadline is in the future
      delete db.sentAlerts[`${activity.id}_24h`];
      delete db.sentAlerts[`${activity.id}_1h`];
      delete db.sentAlerts[`${activity.id}_expired`];
    }

    saveDatabase(db);
    res.json({ success: true, activity });
  });

  // Delete Activity
  app.delete('/api/activities/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.activities = db.activities.filter((a) => a.id !== id);
    delete db.sentAlerts[`${id}_24h`];
    delete db.sentAlerts[`${id}_1h`];
    delete db.sentAlerts[`${id}_expired`];

    saveDatabase(db);
    res.json({ success: true });
  });

  // Create or Update Subject
  app.post('/api/subjects', (req: Request, res: Response) => {
    const { subject, userId } = req.body;
    if (!subject || !subject.name || !subject.color) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti per la materia' });
    }

    const uId = userId || subject.userId || 'default_user';
    ensureUserInitialized(uId);

    const existingIndex = db.subjects.findIndex((s) => s.id === subject.id);
    const updatedSubject: Subject = {
      ...subject,
      userId: uId,
      createdAt: subject.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      db.subjects[existingIndex] = updatedSubject;
    } else {
      db.subjects.push(updatedSubject);
    }

    saveDatabase(db);
    res.json({ success: true, subject: updatedSubject });
  });

  // Delete Subject with resolution option
  app.post('/api/subjects/:id/delete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { action } = req.body; // 'unassign' (keep activities, remove subjectId) or 'delete_tasks'

    if (action === 'delete_tasks') {
      db.activities = db.activities.filter((a) => a.subjectId !== id);
    } else {
      db.activities.forEach((a) => {
        if (a.subjectId === id) {
          delete a.subjectId;
        }
      });
    }

    db.subjects = db.subjects.filter((s) => s.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Update User Settings
  app.post('/api/settings', (req: Request, res: Response) => {
    const { userId, settings } = req.body;
    const uId = userId || 'default_user';
    db.settings[uId] = { ...(db.settings[uId] || DEFAULT_SETTINGS), ...settings };
    saveDatabase(db);
    res.json({ success: true, settings: db.settings[uId] });
  });

  // Mark notifications as read or clear
  app.post('/api/notifications/read', (req: Request, res: Response) => {
    const { notificationIds, all, userId } = req.body;
    const uId = userId || 'default_user';

    db.notifications.forEach((n) => {
      const act = db.activities.find((a) => a.id === n.activityId);
      if (!act || (act.userId || 'default_user') === uId) {
        if (all || (notificationIds && notificationIds.includes(n.id))) {
          n.read = true;
        }
      }
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // Register Web Push subscription
  app.post('/api/push-subscribe', (req: Request, res: Response) => {
    const { subscription, userId } = req.body;
    const uId = userId || 'default_user';

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    if (!db.pushSubscriptions[uId]) {
      db.pushSubscriptions[uId] = [];
    }

    // avoid duplicate endpoint
    const exists = db.pushSubscriptions[uId].some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      db.pushSubscriptions[uId].push(subscription);
      saveDatabase(db);
    }

    res.json({ success: true });
  });

  // Test push notification
  app.post('/api/test-push', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const uId = userId || 'default_user';

    await sendPushToUser(uId, {
      title: 'BressFlow Notifiche Attive',
      body: 'Le notifiche push del browser sono configurate correttamente!',
      data: { url: '/' },
    });

    res.json({ success: true });
  });

  // Mount Vite in dev mode or serve dist in production
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BressFlow server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BressFlow server:', err);
  process.exit(1);
});
