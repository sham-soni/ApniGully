import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type?: string;
  postId?: string;
  chatId?: string;
  userId?: string;
  neighborhoodId?: string;
  [key: string]: any;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications are not available in simulator');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for push notifications not granted');
    return false;
  }

  return true;
}

export async function registerForPushNotifications(): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  try {
    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const pushToken = tokenData.data;
    console.log('Push token:', pushToken);

    // Register token with backend
    await registerPushTokenWithBackend(pushToken);

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    return pushToken;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

async function registerPushTokenWithBackend(pushToken: string): Promise<void> {
  try {
    await api.patch('/users/me/push-token', { pushToken });
    console.log('Push token registered with backend');
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
  }
}

async function setupAndroidChannels(): Promise<void> {
  // Default channel for general notifications
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f97316',
    sound: 'default',
  });

  // Messages channel
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    description: 'Chat message notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f97316',
    sound: 'default',
  });

  // Safety alerts channel
  await Notifications.setNotificationChannelAsync('safety', {
    name: 'Safety Alerts',
    description: 'Critical safety alerts for your area',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 500, 500],
    lightColor: '#ef4444',
    sound: 'default',
  });

  // Posts channel
  await Notifications.setNotificationChannelAsync('posts', {
    name: 'Post Updates',
    description: 'Updates on posts you follow',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  trigger?: Notifications.NotificationTriggerInput,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: trigger || null,
  });
}

export function parseNotificationData(
  response: Notifications.NotificationResponse,
): NotificationData | null {
  try {
    const data = response.notification.request.content.data as NotificationData;
    return data || null;
  } catch {
    return null;
  }
}

export function getNotificationNavigationTarget(
  data: NotificationData,
): { screen: string; params?: any } | null {
  switch (data.type) {
    case 'message':
    case 'chat':
      if (data.chatId) {
        return { screen: 'Chat', params: { id: data.chatId } };
      }
      break;
    case 'post':
    case 'post_comment':
    case 'post_like':
      if (data.postId) {
        return { screen: 'PostDetail', params: { id: data.postId } };
      }
      break;
    case 'helper':
      if (data.userId) {
        return { screen: 'HelperProfile', params: { id: data.userId } };
      }
      break;
    case 'rental':
      if (data.rentalId) {
        return { screen: 'RentalDetail', params: { id: data.rentalId } };
      }
      break;
    case 'shop':
      if (data.shopId) {
        return { screen: 'ShopDetail', params: { id: data.shopId } };
      }
      break;
    default:
      return null;
  }
  return null;
}
