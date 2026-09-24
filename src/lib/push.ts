/**
 * Client-side Expo push registration (Phase 6, 02-ARCHITECTURE.md §6).
 *
 * The token is cached in SecureStore and mirrored to users.push_token so the
 * /match Edge Function can deliver a notification on a probable match.
 * Everything here is best-effort and non-fatal: without an EAS projectId the
 * Expo Go client cannot mint a token, so we simply no-op and let the in-app
 * states carry the experience.
 *
 * NOTE (SDK 53+): Android remote-push support was removed from Expo Go, and
 * the expo-notifications module now THROWS at evaluation time there. We must
 * therefore never import it statically — it is loaded lazily only when running
 * in a development/production build (executionEnvironment !== StoreClient).
 * See docs/06-LIBRARY-DOCS.md.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

import { EXPO_PUSH_TOKEN_KEY } from '@/constants/keys';
import { updatePushToken } from '@/lib/db';

let cached: string | null = null;

type PushNotificationsModule = typeof import('expo-notifications');

let notificationsModule: PushNotificationsModule | null | undefined;

/** Load expo-notifications only outside Expo Go (it throws on load there). */
async function loadNotifications(): Promise<PushNotificationsModule | null> {
  if (notificationsModule !== undefined) return notificationsModule;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    notificationsModule = null;
    return null;
  }
  try {
    notificationsModule = await import('expo-notifications');
  } catch (error) {
    console.warn('expo-notifications unavailable in this runtime', error);
    notificationsModule = null;
  }
  return notificationsModule;
}

/** Resolve the current device's Expo push token (cached; null when unavailable). */
export async function getExpoPushToken(): Promise<string | null> {
  if (cached) return cached;
  const stored = await SecureStore.getItemAsync(EXPO_PUSH_TOKEN_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }
  if (!Device.isDevice) return null; // Simulators cannot receive pushes.
  const Notifications = await loadNotifications();
  if (!Notifications) return null; // Expo Go (SDK 53+) or no native module.
  const current = await Notifications.getPermissionsAsync();
  const requested = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!requested.granted) return null;
  const projectId = Constants.easConfig?.projectId;
  if (!projectId) return null; // No EAS project configured yet (Phase 0 eas init).
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await SecureStore.setItemAsync(EXPO_PUSH_TOKEN_KEY, token);
  cached = token;
  return token;
}

/**
 * Mirror the device token into the signed-in user's row. Run once after sign-in;
 * failures are logged, never thrown (push is an enhancement, not a gate).
 */
export async function syncPushToken(userId: string): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await updatePushToken(userId, token);
  } catch (error) {
    console.warn('Push token sync skipped', error);
  }
}
