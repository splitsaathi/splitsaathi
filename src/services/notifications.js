import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateProfile } from './database';
import { supabase } from './supabase';

// Foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Permission + Token ─────────────────────────────────────────────────────────
export const registerForPushNotifications = async (userId) => {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'SplitSaathi',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#10b981',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name:       'Settlement Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound:      'default',
    });
  }

  // Push token only works with EAS build — skip silently in Expo Go
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token && userId) {
      await updateProfile(userId, { push_token: token });
    }
    return token;
  } catch (e) {
    console.log('Push token skipped (Expo Go mode):', e.message);
    return null;
  }
};

// ── Schedule local reminder ────────────────────────────────────────────────────
export const scheduleReminder = async (bill, reminderDate) => {
  const trigger = new Date(reminderDate);
  trigger.setHours(9, 0, 0);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Settlement Reminder',
      body:  `"${bill.title}" — ₹${(bill.amount / bill.split_among.length).toFixed(2)} is still pending!`,
      data:  { billId: bill.id, groupId: bill.group_id },
      sound: 'default',
    },
    trigger,
  });

  return id;
};

export const cancelReminder = async (notificationId) => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};

// ── Send push via Supabase Edge Function ──────────────────────────────────────
export const sendNotification = async ({ toUserId, title, body, data = {} }) => {
  try {
    await supabase.functions.invoke('send-notification', {
      body: { toUserId, title, body, data },
    });
  } catch (err) {
    console.log('Notification send error:', err);
  }
};

// ── Notification listeners ────────────────────────────────────────────────────
export const addNotificationListeners = (onReceive, onResponse) => {
  const rcv = Notifications.addNotificationReceivedListener(onReceive);
  const res = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => { rcv.remove(); res.remove(); };
};
