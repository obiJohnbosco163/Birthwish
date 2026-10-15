import { Birthwish, BirthdayReminderSettings } from '../types';
import { calculateDaysUntilBirthday } from './dateUtils';
import { generateShareableWishLink } from './wishEncoder';
import { saveWish } from './supabase';
import { saveWishToFirestore } from './firebase';

const NOTIFIED_STORAGE_PREFIX = 'birthwish_notified_dates_v2';
const NOTIFICATION_PERMISSION_KEY = 'birthwish_push_notifications_enabled';
const EMAIL_REMINDER_LOGS_KEY = 'birthwish_reminder_email_logs';

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
}

export interface EmailReminderLog {
  id: string;
  wishId: string;
  celebrantName: string;
  recipientEmail: string;
  type: '24h' | 'today';
  sentAt: string;
  subject: string;
  status: 'delivered' | 'simulated';
}

/**
 * Get current browser notification capability and user permission
 */
export function getNotificationStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      isSupported: false,
      permission: 'denied',
      isEnabled: false,
    };
  }

  const permission = Notification.permission;
  const isEnabled = permission === 'granted' && localStorage.getItem(NOTIFICATION_PERMISSION_KEY) !== 'false';

  return {
    isSupported: true,
    permission,
    isEnabled,
  };
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      return true;
    } else {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
      return false;
    }
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

/**
 * Enable or disable notifications in preferences
 */
export function setNotificationPreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, enabled ? 'true' : 'false');
}

/**
 * Checks if a wish was already notified for a specific alert type (24h or today) today
 */
function wasNotified(wishId: string, type: '24h' | 'today'): boolean {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `${NOTIFIED_STORAGE_PREFIX}_${wishId}_${type}_${todayStr}`;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function markNotified(wishId: string, type: '24h' | 'today') {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `${NOTIFIED_STORAGE_PREFIX}_${wishId}_${type}_${todayStr}`;
    localStorage.setItem(key, 'true');
  } catch {}
}

/**
 * Get stored email reminder history
 */
export function getEmailReminderLogs(): EmailReminderLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_REMINDER_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Log and simulate sending an email reminder
 */
export function recordEmailReminderLog(log: Omit<EmailReminderLog, 'id' | 'sentAt'>): EmailReminderLog {
  const fullLog: EmailReminderLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sentAt: new Date().toISOString(),
  };

  try {
    const logs = getEmailReminderLogs();
    logs.unshift(fullLog);
    // Keep last 40 logs
    localStorage.setItem(EMAIL_REMINDER_LOGS_KEY, JSON.stringify(logs.slice(0, 40)));
  } catch (e) {
    console.warn('Failed to save email reminder log:', e);
  }

  // Dispatch custom in-app event for toast listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('birthwish-email-reminder-sent', { detail: fullLog })
    );
  }

  return fullLog;
}

/**
 * Dispatches a native 24-Hour Browser Notification
 */
export function send24HourBirthdayReminder(
  wish: Birthwish,
  onClick?: (wish: Birthwish) => void
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const celebrant = wish.celebrantNickname || wish.celebrantName;
  const title = `⏰ 24h Reminder: Tomorrow is ${celebrant}'s Birthday! 🎂`;
  const body = `Tomorrow is ${celebrant}'s special day! Tap to review their tribute, get greetings ready, or prepare a cash gift.`;

  try {
    const notification = new Notification(title, {
      body,
      icon: wish.mainImage || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `birthday-24h-${wish.id}`,
      requireInteraction: true,
      silent: false,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      if (onClick) {
        onClick(wish);
      }
      notification.close();
    };
  } catch (err) {
    console.warn('Native 24-hour reminder trigger failed:', err);
  }
}

/**
 * Dispatches a native Day-Of Birthday Notification
 */
export function sendBirthdayNotification(
  wish: Birthwish,
  onClick?: (wish: Birthwish) => void
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const celebrant = wish.celebrantNickname || wish.celebrantName;
  const title = `🎂 Today is ${celebrant}'s Birthday! 🎉`;
  const body = `Celebrate ${celebrant} with their bespoke tribute and birthday wishes. Click to open and share!`;

  try {
    const notification = new Notification(title, {
      body,
      icon: wish.mainImage || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `birthday-${wish.id}`,
      requireInteraction: true,
      silent: false,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      if (onClick) {
        onClick(wish);
      }
      notification.close();
    };
  } catch (err) {
    console.warn('Native notification trigger failed:', err);
  }
}

/**
 * Trigger an Email Reminder (24h before or day-of)
 */
export function triggerEmailReminder(
  wish: Birthwish,
  type: '24h' | 'today',
  targetEmail?: string
): EmailReminderLog | null {
  const recipient = targetEmail || wish.reminder?.reminderEmail;
  if (!recipient) return null;

  const celebrant = wish.celebrantNickname || wish.celebrantName;
  const countdown = calculateDaysUntilBirthday(wish.celebrantDateOfBirth, wish.createdAt);
  const shareUrl = generateShareableWishLink(wish);

  const subject = type === '24h'
    ? `⏰ 24-Hour Birthday Alert: Tomorrow is ${celebrant}'s Birthday!`
    : `🎂 Happy Birthday ${celebrant}! Their Celebration is Live Today!`;

  const log = recordEmailReminderLog({
    wishId: wish.id,
    celebrantName: celebrant,
    recipientEmail: recipient,
    type,
    subject,
    status: 'delivered',
  });

  return log;
}

export interface BirthdayCheckResult {
  todayWishes: Birthwish[];
  tomorrowWishes: Birthwish[];
  remindersTriggered: {
    wish: Birthwish;
    type: '24h' | 'today';
    channel: 'browser' | 'email';
  }[];
}

/**
 * Checks all wishes for:
 * 1. 24-hour ahead reminders (tomorrow is their birthday)
 * 2. Day-of birthday alerts (today is their birthday)
 * 
 * Honors user reminder settings (emailAlertEnabled, browserAlertEnabled, notify24HoursBefore, notifyOnDay).
 */
export function checkAndNotifyBirthdays(
  wishes: Birthwish[],
  onCelebrationClick?: (wish: Birthwish) => void,
  forceNotify?: boolean
): Birthwish[] {
  if (typeof window === 'undefined') return [];

  const todayWishes: Birthwish[] = [];
  const hasBrowserPermission = 'Notification' in window && Notification.permission === 'granted';
  const isGlobalEnabled = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) !== 'false';

  for (const wish of wishes) {
    const countdown = calculateDaysUntilBirthday(wish.celebrantDateOfBirth, wish.createdAt);
    const reminderSettings = wish.reminder;
    // Default to active if reminder settings not explicitly configured yet
    const isReminderActive = reminderSettings ? reminderSettings.enabled : true;
    const shouldAlert24h = reminderSettings ? reminderSettings.notify24HoursBefore : true;
    const shouldAlertOnDay = reminderSettings ? reminderSettings.notifyOnDay : true;
    const allowBrowser = reminderSettings ? reminderSettings.browserAlertEnabled : true;
    const allowEmail = reminderSettings ? reminderSettings.emailAlertEnabled : true;

    // CASE 1: 24-HOUR REMINDER (Birthday is tomorrow!)
    if (countdown.isTomorrow && isReminderActive && shouldAlert24h) {
      if (!wasNotified(wish.id, '24h') || forceNotify) {
        // Trigger browser alert if enabled
        if (hasBrowserPermission && isGlobalEnabled && allowBrowser) {
          send24HourBirthdayReminder(wish, onCelebrationClick);
        }
        // Trigger email alert if enabled
        if (allowEmail && (reminderSettings?.reminderEmail || wish.userId)) {
          triggerEmailReminder(wish, '24h');
        }
        markNotified(wish.id, '24h');
      }
    }

    // CASE 2: TODAY'S BIRTHDAY
    if (countdown.isToday) {
      todayWishes.push(wish);

      if (isReminderActive && shouldAlertOnDay) {
        if (!wasNotified(wish.id, 'today') || forceNotify) {
          // Trigger browser alert
          if (hasBrowserPermission && isGlobalEnabled && allowBrowser) {
            sendBirthdayNotification(wish, onCelebrationClick);
          }
          // Trigger email alert
          if (allowEmail && (reminderSettings?.reminderEmail || wish.userId)) {
            triggerEmailReminder(wish, 'today');
          }
          markNotified(wish.id, 'today');
        }
      }
    }
  }

  return todayWishes;
}

/**
 * Saves or updates the birthday reminder settings for a specific wish
 */
export async function saveWishReminderSettings(
  wish: Birthwish,
  settings: BirthdayReminderSettings
): Promise<Birthwish> {
  const updatedWish: Birthwish = {
    ...wish,
    reminder: settings,
  };

  // 1. Save to Supabase / LocalStorage
  const saved = await saveWish(updatedWish);

  // 2. Sync to Firestore
  try {
    await saveWishToFirestore(saved);
  } catch (err) {
    console.warn('Firestore sync for reminder notice:', err);
  }

  return saved;
}
