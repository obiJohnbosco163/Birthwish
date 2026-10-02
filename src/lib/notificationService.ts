import { Birthwish } from '../types';
import { calculateDaysUntilBirthday } from './dateUtils';

const NOTIFIED_STORAGE_PREFIX = 'birthwish_notified_dates_v1';
const NOTIFICATION_PERMISSION_KEY = 'birthwish_push_notifications_enabled';

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
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
 * Checks if a wish was already notified today so we don't spam the user repeatedly
 */
function wasNotifiedToday(wishId: string): boolean {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `${NOTIFIED_STORAGE_PREFIX}_${wishId}_${todayStr}`;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function markNotifiedToday(wishId: string) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `${NOTIFIED_STORAGE_PREFIX}_${wishId}_${todayStr}`;
    localStorage.setItem(key, 'true');
  } catch {}
}

/**
 * Checks all wishes and triggers alerts for celebrations happening today
 * Returns the list of wishes that celebrate today
 */
export function checkAndNotifyBirthdays(
  wishes: Birthwish[],
  onCelebrationClick?: (wish: Birthwish) => void,
  forceNotify?: boolean
): Birthwish[] {
  if (typeof window === 'undefined') return [];

  const todayWishes: Birthwish[] = [];

  for (const wish of wishes) {
    const countdown = calculateDaysUntilBirthday(wish.celebrantDateOfBirth, wish.createdAt);
    if (countdown.isToday) {
      todayWishes.push(wish);

      // Check if user has granted browser notification permissions
      if ('Notification' in window && Notification.permission === 'granted') {
        const isEnabled = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) !== 'false';
        if (isEnabled && (!wasNotifiedToday(wish.id) || forceNotify)) {
          sendBirthdayNotification(wish, onCelebrationClick);
          markNotifiedToday(wish.id);
        }
      }
    }
  }

  return todayWishes;
}

/**
 * Dispatches a native browser notification
 */
export function sendBirthdayNotification(
  wish: Birthwish,
  onClick?: (wish: Birthwish) => void
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const celebrant = wish.celebrantNickname || wish.celebrantName;
  const title = `🎂 Today is ${celebrant}'s Birthday! 🎉`;
  const body = `Celebrate ${celebrant} with their bespoke tribute and birthday wishes. Click to view!`;

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
