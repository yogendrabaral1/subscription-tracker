import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { addSubscription } from '../services/database';
import { scheduleBillReminder } from '../services/notifications';
import { Subscription } from '../types';

interface AddSubscriptionScreenProps {
  onSave: () => void;
  onCancel: () => void;
}

const AddSubscriptionScreen: React.FC<AddSubscriptionScreenProps> = ({ onSave, onCancel }) => {
  const { state, dispatch } = useApp();
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

    // For auto-pay, calculate next billing date based on billing cycle
    let nextBillingDate = formData.nextBillingDate;
    let expiryDate = formData.renewalDate;

    if (formData.isAutoPayEnabled) {
      // Calculate next billing date based on billing cycle
      const today = new Date();
      let nextDate = new Date(today);
      
      switch (formData.billingCycle) {
        case 'weekly':
          nextDate.setDate(today.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(today.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(today.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(today.getFullYear() + 1);
          break;
      }
      
      nextBillingDate = nextDate.toISOString().split('T')[0];
      expiryDate = ''; // No expiry date for auto-pay
    } else {
      // For manual, use provided renewal date as expiry date
      expiryDate = formData.renewalDate;
      nextBillingDate = ''; // No next billing date for manual
    }

    try {
      const subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
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

      const subscriptionId = await addSubscription(subscription);
      
      // Schedule notification only for manual subscriptions
      if (!formData.isAutoPayEnabled) {
        const newSubscription: Subscription = {
          ...subscription,
          id: subscriptionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Convert to bill format for notification service
        const bill = {
          id: newSubscription.id,
          name: newSubscription.name,
          category: 'subscription' as const,
          amount: newSubscription.amount,
          dueDate: newSubscription.expiryDate,
          frequency: newSubscription.billingCycle === 'monthly' ? 'monthly' as const : 
                     newSubscription.billingCycle === 'yearly' ? 'yearly' as const : 'custom' as const,
          reminderTime: newSubscription.reminderTime,
          isPaid: false,
          createdAt: newSubscription.createdAt,
          updatedAt: newSubscription.updatedAt,
        };
        
        await scheduleBillReminder(bill);
      }
      
      dispatch({ type: 'ADD_SUBSCRIPTION', payload: {
        ...subscription,
        id: subscriptionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }});
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

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Subscription</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Netflix, Spotify, Adobe Creative Cloud"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Provider (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Netflix Inc., Spotify AB"
              value={formData.provider}
              onChangeText={(text) => setFormData({ ...formData, provider: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryButton,
                    formData.category === category.key && styles.categoryButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.key as any })}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === category.key && styles.categoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount & Currency *</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0.00"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric"
              />
              <View style={styles.currencyContainer}>
                <Text style={styles.currencyLabel}>Currency:</Text>
                <View style={styles.currencyButtons}>
                  {currencies.map((currency) => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        styles.currencyButton,
                        formData.currency === currency && styles.currencyButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, currency })}
                    >
                      <Text
                        style={[
                          styles.currencyButtonText,
                          formData.currency === currency && styles.currencyButtonTextActive,
                        ]}
                      >
                        {currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Billing Cycle *</Text>
            <View style={styles.billingCycleButtons}>
              {['weekly', 'monthly', 'quarterly', 'yearly'].map((cycle) => (
                <TouchableOpacity
                  key={cycle}
                  style={[
                    styles.billingCycleButton,
                    formData.billingCycle === cycle && styles.billingCycleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, billingCycle: cycle as any })}
                >
                  <Text
                    style={[
                      styles.billingCycleButtonText,
                      formData.billingCycle === cycle && styles.billingCycleButtonTextActive,
                    ]}
                  >
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Type *</Text>
            <View style={styles.paymentTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  formData.isAutoPayEnabled && styles.paymentTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, isAutoPayEnabled: true })}
              >
                <Text style={styles.paymentTypeIcon}>🔄</Text>
                <Text
                  style={[
                    styles.paymentTypeText,
                    formData.isAutoPayEnabled && styles.paymentTypeTextActive,
                  ]}
                >
                  Auto-pay
                </Text>
                <Text style={styles.paymentTypeSubtext}>
                  Automatically renews
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  !formData.isAutoPayEnabled && styles.paymentTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, isAutoPayEnabled: false })}
              >
                <Text style={styles.paymentTypeIcon}>✋</Text>
                <Text
                  style={[
                    styles.paymentTypeText,
                    !formData.isAutoPayEnabled && styles.paymentTypeTextActive,
                  ]}
                >
                  Manual
                </Text>
                <Text style={styles.paymentTypeSubtext}>
                  Expires and needs renewal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!formData.isAutoPayEnabled && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Renewal Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.renewalDate}
                onChangeText={(text) => setFormData({ ...formData, renewalDate: text })}
              />
              <Text style={styles.helpText}>
                When this subscription needs to be renewed manually
              </Text>
            </View>
          )}

          {!formData.isAutoPayEnabled && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reminder Time</Text>
              <View style={styles.reminderButtons}>
                {[1, 3, 7].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.reminderButton,
                      formData.reminderTime === days && styles.reminderButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, reminderTime: days })}
                  >
                    <Text
                      style={[
                        styles.reminderButtonText,
                        formData.reminderTime === days && styles.reminderButtonTextActive,
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
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this subscription..."
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
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    color: '#2196F3',
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    marginBottom: 8,
  },
  currencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  currencyButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  currencyButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  currencyButtonText: {
    fontSize: 12,
    color: '#666',
  },
  currencyButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  billingCycleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  billingCycleButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  billingCycleButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  billingCycleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  billingCycleButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentTypeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  paymentTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  paymentTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentTypeTextActive: {
    color: 'white',
  },
  paymentTypeSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  reminderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reminderButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  reminderButtonText: {
    fontSize: 14,
    color: '#666',
  },
  reminderButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AddSubscriptionScreen;
