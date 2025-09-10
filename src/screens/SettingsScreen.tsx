import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { updateSubscription, saveUser, clearAllData } from '../services/database';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onNotificationTest: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout, onNotificationTest }) => {
  const { state, dispatch } = useApp();
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(state.user?.theme === 'dark');
  const [defaultReminderTime, setDefaultReminderTime] = useState(state.user?.defaultReminderTime || 1);
  const [selectedCurrency, setSelectedCurrency] = useState(state.user?.currency || 'INR');

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', enabled: true },
    { code: 'USD', symbol: '$', name: 'US Dollar', enabled: false },
    { code: 'EUR', symbol: '€', name: 'Euro', enabled: false },
    { code: 'GBP', symbol: '£', name: 'British Pound', enabled: false },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', enabled: false },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', enabled: false },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', enabled: false },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', enabled: false },
  ];

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

  const handleCurrencyChange = async (currency: string) => {
    // Only allow INR currency changes
    if (currency !== 'INR') {
      Alert.alert('Currency Not Available', 'Only INR currency is currently supported.');
      return;
    }
    
    setSelectedCurrency(currency);
    if (state.user) {
      const updatedUser = { ...state.user, currency };
      try {
        await saveUser(updatedUser);
        dispatch({ type: 'SET_USER', payload: updatedUser });
      } catch (error) {
        Alert.alert('Error', 'Failed to update currency');
        setSelectedCurrency(state.user.currency);
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
          onPress: async () => {
            try {
              await clearAllData();
              dispatch({ type: 'SET_SUBSCRIPTIONS', payload: [] });
              dispatch({ type: 'SET_DASHBOARD_SUMMARY', payload: null });
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Currency Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Currency</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Select your preferred currency for displaying amounts
          </Text>
          
          <View style={styles.currencyGrid}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyButton,
                  { 
                    backgroundColor: selectedCurrency === currency.code 
                      ? theme.colors.primary 
                      : theme.colors.background,
                    borderColor: theme.colors.border,
                    opacity: currency.enabled ? 1 : 0.5
                  }
                ]}
                onPress={() => currency.enabled ? handleCurrencyChange(currency.code) : 
                  Alert.alert('Coming Soon', 'This currency will be available in a future update.')}
                disabled={!currency.enabled}
              >
                <Text style={[
                  styles.currencySymbol, 
                  { color: selectedCurrency === currency.code ? '#ffffff' : theme.colors.text }
                ]}>
                  {currency.symbol}
                </Text>
                <Text style={[
                  styles.currencyCode,
                  { color: selectedCurrency === currency.code ? '#ffffff' : theme.colors.text }
                ]}>
                  {currency.code}
                </Text>
                <Text style={[
                  styles.currencyName,
                  { color: selectedCurrency === currency.code ? '#ffffff' : theme.colors.textSecondary }
                ]}>
                  {currency.name}
                </Text>
                {!currency.enabled && (
                  <Text style={[styles.comingSoon, { color: theme.colors.textSecondary }]}>
                    Coming Soon
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications</Text>
          
          {/* <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={onNotificationTest}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
              Test Notifications
            </Text>
            <Text style={[styles.actionButtonDescription, { color: theme.colors.textSecondary }]}>
              Test and debug notification functionality
            </Text>
          </TouchableOpacity> */}
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Default Reminder Time</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                How many days before expiry to remind you
              </Text>
            </View>
            <View style={styles.reminderButtons}>
              {[1, 3, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.reminderButton,
                    { 
                      backgroundColor: defaultReminderTime === days 
                        ? theme.colors.primary 
                        : theme.colors.background,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => handleReminderTimeChange(days)}
                >
                  <Text style={[
                    styles.reminderButtonText,
                    { color: defaultReminderTime === days ? '#ffffff' : theme.colors.text }
                  ]}>
                    {days} day{days > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data Management</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={handleClearData}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
              Clear All Data
            </Text>
            <Text style={[styles.actionButtonDescription, { color: theme.colors.textSecondary }]}>
              Delete all subscriptions and user data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={() => Alert.alert('Coming Soon', 'Export feature will be available in a future update.')}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
              Export Data
            </Text>
            <Text style={[styles.actionButtonDescription, { color: theme.colors.textSecondary }]}>
              Download your subscription data
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
              Logout
            </Text>
            <Text style={[styles.actionButtonDescription, { color: theme.colors.textSecondary }]}>
              Sign out of your account
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
          <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>
            Subscription Tracker v1.0.0
          </Text>
          <Text style={[styles.appDescription, { color: theme.colors.textSecondary }]}>
            Track and manage your subscriptions with ease
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  currencyButton: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 12,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  reminderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  reminderButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 14,
  },
  appVersion: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
  },
});

export default SettingsScreen;
