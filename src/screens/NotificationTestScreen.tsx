import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';

const NotificationTestScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const theme = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);

  useEffect(() => {
    checkPermissions();
    loadScheduledNotifications();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert('Permission Denied', 'Notification permissions were denied.');
    }
  };

  const loadScheduledNotifications = async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    setScheduledNotifications(notifications);
  };

  const scheduleTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please grant notification permissions first.');
      return;
    }

    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 5); // 5 seconds from now

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from your subscription tracker!',
          data: { test: true },
        },
        trigger: {
          date: triggerDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      });

      Alert.alert('Success', 'Test notification scheduled for 5 seconds from now!');
      loadScheduledNotifications();
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  };

  const scheduleImmediateNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please grant notification permissions first.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Immediate Test',
          body: 'This notification should appear immediately!',
          data: { immediate: true },
        },
        trigger: null, // Immediate notification
      });

      Alert.alert('Success', 'Immediate notification sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error}`);
    }
  };

  const clearAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('Success', 'All scheduled notifications cleared!');
    loadScheduledNotifications();
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Notification Test</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Permission Status</Text>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            Status: {permissionStatus}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Test Notifications</Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.success }]}
            onPress={scheduleImmediateNotification}
          >
            <Text style={styles.buttonText}>Send Immediate Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.warning }]}
            onPress={scheduleTestNotification}
          >
            <Text style={styles.buttonText}>Schedule Test (5 seconds)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.error }]}
            onPress={clearAllNotifications}
          >
            <Text style={styles.buttonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Scheduled Notifications ({scheduledNotifications.length})
          </Text>
          
          {scheduledNotifications.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No scheduled notifications
            </Text>
          ) : (
            scheduledNotifications.map((notification, index) => (
              <View key={index} style={[styles.notificationItem, { borderColor: theme.colors.border }]}>
                <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                  {notification.content.title}
                </Text>
                <Text style={[styles.notificationBody, { color: theme.colors.textSecondary }]}>
                  {notification.content.body}
                </Text>
                <Text style={[styles.notificationDate, { color: theme.colors.textSecondary }]}>
                  Trigger: {notification.trigger ? new Date(notification.trigger.value).toLocaleString() : 'Immediate'}
                </Text>
              </View>
            ))
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.info }]}
            onPress={loadScheduledNotifications}
          >
            <Text style={styles.buttonText}>Refresh List</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Testing Tips</Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • Grant notification permissions first{'\n'}
            • Try "Send Immediate Notification" first{'\n'}
            • Check your device's notification settings{'\n'}
            • On iOS Simulator: Device → Notifications → Allow{'\n'}
            • On Android: Check notification settings in device settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationTestScreen;
