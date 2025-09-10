import * as Notifications from 'expo-notifications';
import { Subscription } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleSubscriptionReminder = async (subscription: Subscription) => {
  if (!subscription.expiryDate) {
    return; // No expiry date, no reminder needed
  }

  const dueDate = new Date(subscription.expiryDate);
  const reminderDate = new Date(dueDate.getTime() - (subscription.reminderTime * 24 * 60 * 60 * 1000));
  
  // Don't schedule if reminder date is in the past
  if (reminderDate <= new Date()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Subscription Reminder',
      body: `${subscription.name} payment of ₹${subscription.amount} due ${subscription.reminderTime === 1 ? 'tomorrow' : `in ${subscription.reminderTime} days`}!`,
      data: { subscriptionId: subscription.id },
    },
    trigger: {
      date: reminderDate,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });
};

export const cancelSubscriptionReminder = async (subscriptionId: string) => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const notificationToCancel = scheduledNotifications.find(
    notification => notification.content.data?.subscriptionId === subscriptionId
  );
  
  if (notificationToCancel) {
    await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
  }
};

export const scheduleAllSubscriptionReminders = async (subscriptions: Subscription[]) => {
  // Cancel all existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Schedule new ones for manual subscriptions only
  for (const subscription of subscriptions) {
    if (!subscription.isAutoPayEnabled && subscription.isActive) {
      await scheduleSubscriptionReminder(subscription);
    }
  }
};

// Legacy exports for backward compatibility
export const scheduleBillReminder = scheduleSubscriptionReminder;
export const cancelBillReminder = cancelSubscriptionReminder;
export const scheduleAllBillReminders = scheduleAllSubscriptionReminders;
