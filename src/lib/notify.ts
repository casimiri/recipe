// notify.ts — thin wrapper over expo-notifications for local cook-timer
// reminders. The cook screen's in-app countdown is a JS interval that the OS
// throttles when the app is backgrounded, so we also schedule a real local
// notification that fires at the timer's end regardless of app state.
//
// Local notifications were removed from Expo Go on Android (SDK 53+) — even
// importing the module there logs a warning — so we detect that environment and
// no-op (the in-app countdown still works). They work everywhere else: dev /
// standalone builds and Expo Go on iOS. The module is imported lazily so it's
// never evaluated in the unsupported environment.
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const SUPPORTED = !(isExpoGo && Platform.OS === 'android');

type NotifModule = typeof import('expo-notifications');
let mod: NotifModule | null = null;
let handlerSet = false;

/** Lazily load expo-notifications (and wire its handler) where supported. */
async function load(): Promise<NotifModule | null> {
  if (!SUPPORTED) return null;
  try {
    if (!mod) mod = await import('expo-notifications');
    if (!handlerSet) {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }
    return mod;
  } catch {
    return null;
  }
}

let permissionAsked = false;
let granted = false;

/** Request notification permission once per session; returns whether granted. */
export async function ensureNotifPermission(): Promise<boolean> {
  const N = await load();
  if (!N) return false;
  if (permissionAsked) return granted;
  permissionAsked = true;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('timers', {
        name: 'Cook timers',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const existing = await N.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') status = (await N.requestPermissionsAsync()).status;
    granted = status === 'granted';
  } catch {
    granted = false;
  }
  return granted;
}

/**
 * Schedule a local notification `seconds` from now. Returns the notification id
 * (pass to cancelNotif), or null if unsupported, permission was denied, or
 * scheduling failed.
 */
export async function scheduleTimerDone(seconds: number, body: string): Promise<string | null> {
  const N = await load();
  if (!N || !(await ensureNotifPermission())) return null;
  try {
    return await N.scheduleNotificationAsync({
      content: { title: 'Timer done ⏱️', body, sound: true },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: 'timers',
      },
    });
  } catch {
    return null;
  }
}

/** Cancel a previously scheduled notification; safe to call with null. */
export async function cancelNotif(id: string | null): Promise<void> {
  if (!id) return;
  const N = await load();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    /* already fired or cancelled */
  }
}
