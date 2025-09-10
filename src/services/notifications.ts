import * as Notifications from 'expo-notifications';

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  reminderTime: number;
  isPaid: boolean;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleBillReminder = async (bill: Bill) => {
  const dueDate = new Date(bill.dueDate);
  const reminderDate = new Date(dueDate.getTime() - (bill.reminderTime * 24 * 60 * 60 * 1000));
  
  // Don't schedule if reminder date is in the past
  if (reminderDate <= new Date()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Subscription Reminder',
      body: `${bill.name} payment of ₹${bill.amount} due ${bill.reminderTime === 1 ? 'tomorrow' : `in ${bill.reminderTime} days`}!`,
      data: { billId: bill.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
};

export const cancelBillReminder = async (billId: string) => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const notificationToCancel = scheduledNotifications.find(
    notification => notification.content.data?.billId === billId
  );
  
  if (notificationToCancel) {
    await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
  }
};

export const scheduleAllBillReminders = async (bills: Bill[]) => {
  // Cancel all existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Schedule new ones
  for (const bill of bills) {
    if (!bill.isPaid) {
      await scheduleBillReminder(bill);
    }
  }
};
