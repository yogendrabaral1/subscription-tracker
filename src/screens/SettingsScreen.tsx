import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { updateSubscription, saveUser } from '../services/database';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { state, dispatch } = useApp();
  const [isDarkMode, setIsDarkMode] = useState(state.user?.theme === 'dark');
  const [defaultReminderTime, setDefaultReminderTime] = useState(state.user?.defaultReminderTime || 1);

  const handleThemeToggle = async (value: boolean) => {
    setIsDarkMode(value);
    if (state.user) {
      const updatedUser = { 
        ...state.user, 
        theme: (value ? 'dark' : 'light') as 'dark' | 'light'
      };
      try {
        await saveUser(updatedUser);
        dispatch({ type: 'SET_USER', payload: updatedUser });
      } catch (error) {
        Alert.alert('Error', 'Failed to update theme');
        setIsDarkMode(!value);
      }
    }
  };

  const handleReminderTimeChange = async (time: number) => {
    setDefaultReminderTime(time);
    if (state.user) {
      const updatedUser = { ...state.user, defaultReminderTime: time };
      try {
        await saveUser(updatedUser);
        dispatch({ type: 'SET_USER', payload: updatedUser });
      } catch (error) {
        Alert.alert('Error', 'Failed to update reminder time');
        setDefaultReminderTime(state.user.defaultReminderTime);
      }
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your subscriptions and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // This would clear all data
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export feature coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Name</Text>
            <Text style={styles.settingValue}>{state.user?.name || 'Guest User'}</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>{state.user?.email || 'Not provided'}</Text>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Default Reminder Time</Text>
            <View style={styles.reminderOptions}>
              {[1, 3, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.reminderOption,
                    defaultReminderTime === days && styles.reminderOptionActive,
                  ]}
                  onPress={() => handleReminderTimeChange(days)}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      defaultReminderTime === days && styles.reminderOptionTextActive,
                    ]}
                  >
                    {days} day{days > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Text style={styles.settingLabel}>Export Data</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <Text style={[styles.settingLabel, styles.dangerText]}>Clear All Data</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    color: '#2196F3',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  settingArrow: {
    fontSize: 16,
    color: '#ccc',
  },
  dangerText: {
    color: '#F44336',
  },
  reminderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reminderOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  reminderOptionText: {
    fontSize: 14,
    color: '#666',
  },
  reminderOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});

export default SettingsScreen;
