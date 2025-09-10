import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { addSubscription, updateSubscription } from '../services/database';
import { scheduleSubscriptionReminder, cancelSubscriptionReminder } from '../services/notifications';
import { Subscription } from '../types';

interface AddSubscriptionScreenProps {
  onSave: () => void;
  onCancel: () => void;
  subscription?: Subscription; // Optional subscription for editing
}

const AddSubscriptionScreen: React.FC<AddSubscriptionScreenProps> = ({ onSave, onCancel, subscription }) => {
  const { state, dispatch } = useApp();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    category: 'entertainment' as 'entertainment' | 'productivity' | 'fitness' | 'news' | 'cloud' | 'other',
    amount: '',
    currency: 'INR',
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'weekly' | 'quarterly',
    isAutoPayEnabled: true,
    nextBillingDate: '',
    renewalDate: '',
    reminderTime: 1,
    description: '',
  });

  // Pre-fill form data when editing
  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        provider: subscription.provider || '',
        category: subscription.category,
        amount: subscription.amount.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        isAutoPayEnabled: subscription.isAutoPayEnabled,
        nextBillingDate: subscription.nextBillingDate || '',
        renewalDate: subscription.nextBillingDate || subscription.expiryDate || '',
        reminderTime: subscription.reminderTime,
        description: subscription.description || '',
      });
    }
  }, [subscription]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // For manual payment type, renewal date is required
    if (!formData.isAutoPayEnabled && !formData.renewalDate) {
      Alert.alert('Error', 'Please enter the renewal date for manual subscriptions');
      return;
    }

    // Use only the dates provided by the user
    let nextBillingDate = formData.renewalDate; // For auto-pay, use renewal date as next billing date
    let expiryDate = formData.renewalDate; // For manual, use renewal date as expiry date

    if (formData.isAutoPayEnabled) {
      // For auto-pay, use provided renewal date as next billing date (or empty if not provided)
      nextBillingDate = formData.renewalDate;
      expiryDate = ''; // No expiry date for auto-pay
    } else {
      // For manual, use provided renewal date as expiry date
      expiryDate = formData.renewalDate;
      nextBillingDate = ''; // No next billing date for manual
    }

    try {
      const subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        provider: formData.provider.trim() || undefined,
        category: formData.category,
        amount,
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        isAutoPayEnabled: formData.isAutoPayEnabled,
        nextBillingDate,
        expiryDate,
        isActive: true,
        reminderTime: formData.isAutoPayEnabled ? 0 : formData.reminderTime, // No reminders for auto-pay
        description: formData.description.trim() || undefined,
      };

      if (subscription) {
        // Update existing subscription
        const updatedSubscription: Subscription = {
          ...subscriptionData,
          id: subscription.id,
          createdAt: subscription.createdAt,
          updatedAt: new Date().toISOString(),
        };

        await updateSubscription(subscription.id, subscriptionData);
        
        // Cancel old notification and schedule new one if needed
        await cancelSubscriptionReminder(subscription.id);
        if (!formData.isAutoPayEnabled) {
          await scheduleSubscriptionReminder(updatedSubscription);
        }
        
        dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updatedSubscription });
      } else {
        // Add new subscription
        const subscriptionId = await addSubscription(subscriptionData);
        
        // Schedule notification only for manual subscriptions
        if (!formData.isAutoPayEnabled) {
          const newSubscription: Subscription = {
            ...subscriptionData,
            id: subscriptionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await scheduleSubscriptionReminder(newSubscription);
        }
        
        dispatch({ type: 'ADD_SUBSCRIPTION', payload: {
          ...subscriptionData,
          id: subscriptionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }});
      }
      
      onSave();
    } catch (error) {
      Alert.alert('Error', 'Failed to save subscription');
    }
  };

  const categories = [
    { key: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { key: 'productivity', label: 'Productivity', icon: '💼' },
    { key: 'fitness', label: 'Fitness', icon: '💪' },
    { key: 'news', label: 'News', icon: '📰' },
    { key: 'cloud', label: 'Cloud Storage', icon: '☁️' },
    { key: 'other', label: 'Other', icon: '📱' },
  ];

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.cancelButton, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>{subscription ? 'Edit Subscription' : 'Add Subscription'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: theme.colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Service Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="e.g., Netflix, Spotify, Adobe Creative Cloud"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Provider (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="e.g., Netflix Inc., Spotify AB"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.provider}
              onChangeText={(text) => setFormData({ ...formData, provider: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Category *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    formData.category === category.key && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.key as any })}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: theme.colors.textSecondary },
                      formData.category === category.key && { color: 'white' },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Amount & Currency *</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.input, styles.amountInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric"
              />
              <View style={styles.currencyContainer}>
                <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>Currency:</Text>
                <View style={[styles.currencyDisplay, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.currencyText, { color: theme.colors.textSecondary }]}>₹ INR</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Billing Cycle *</Text>
            <View style={styles.billingCycleButtons}>
              {['weekly', 'monthly', 'quarterly', 'yearly'].map((cycle) => (
                <TouchableOpacity
                  key={cycle}
                  style={[
                    styles.billingCycleButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    formData.billingCycle === cycle && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, billingCycle: cycle as any })}
                >
                  <Text
                    style={[
                      styles.billingCycleButtonText,
                      { color: theme.colors.textSecondary },
                      formData.billingCycle === cycle && { color: 'white' },
                    ]}
                  >
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Payment Type *</Text>
            <View style={styles.paymentTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  formData.isAutoPayEnabled && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setFormData({ ...formData, isAutoPayEnabled: true })}
              >
                <Text style={styles.paymentTypeIcon}>🔄</Text>
                <Text
                  style={[
                    styles.paymentTypeText,
                    { color: theme.colors.textSecondary },
                    formData.isAutoPayEnabled && { color: 'white' },
                  ]}
                >
                  Auto-pay
                </Text>
                <Text style={[styles.paymentTypeSubtext, { color: theme.colors.textSecondary }]}>
                  Automatically renews
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  !formData.isAutoPayEnabled && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setFormData({ ...formData, isAutoPayEnabled: false })}
              >
                <Text style={styles.paymentTypeIcon}>✋</Text>
                <Text
                  style={[
                    styles.paymentTypeText,
                    { color: theme.colors.textSecondary },
                    !formData.isAutoPayEnabled && { color: 'white' },
                  ]}
                >
                  Manual
                </Text>
                <Text style={[styles.paymentTypeSubtext, { color: theme.colors.textSecondary }]}>
                  Expires and needs renewal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {formData.isAutoPayEnabled ? 'Next Billing Date (Optional)' : 'Renewal Date *'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.renewalDate}
              onChangeText={(text) => setFormData({ ...formData, renewalDate: text })}
            />
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
              {formData.isAutoPayEnabled 
                ? 'Leave empty if you don\'t know the exact billing date'
                : 'When this subscription needs to be renewed manually'
              }
            </Text>
          </View>

          {!formData.isAutoPayEnabled && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Reminder Time</Text>
              <View style={styles.reminderButtons}>
                {[1, 3, 7].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.reminderButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      formData.reminderTime === days && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    ]}
                    onPress={() => setFormData({ ...formData, reminderTime: days })}
                  >
                    <Text
                      style={[
                        styles.reminderButtonText,
                        { color: theme.colors.textSecondary },
                        formData.reminderTime === days && { color: 'white' },
                      ]}
                    >
                      {days} day{days > 1 ? 's' : ''} before
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Add notes about this subscription..."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>
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
  cancelButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  currencyContainer: {
    flex: 1,
  },
  currencyLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  currencyDisplay: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 80,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  billingCycleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  billingCycleButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  billingCycleButtonText: {
    fontSize: 14,
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  paymentTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentTypeSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  reminderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  reminderButtonText: {
    fontSize: 14,
  },
});

export default AddSubscriptionScreen;
