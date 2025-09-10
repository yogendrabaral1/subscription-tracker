import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { updateSubscription, deleteSubscription } from '../services/database';
import { cancelBillReminder } from '../services/notifications';
import { formatCurrency, formatDate, getSubscriptionStatus, getBillingStatus, getStatusColor, getBillingStatusColor, getBillingCycleText } from '../utils/helpers';

interface BillDetailScreenProps {
  billId: string;
  onBack: () => void;
  onEdit: () => void;
}

const BillDetailScreen: React.FC<BillDetailScreenProps> = ({ billId, onBack, onEdit }) => {
  const { state, dispatch } = useApp();
  const subscription = state.subscriptions.find(s => s.id === billId);

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Subscription not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={onBack}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getSubscriptionStatus(subscription);
  const billingStatus = getBillingStatus(subscription);
  const statusColor = getStatusColor(status);
  const billingColor = getBillingStatusColor(billingStatus);

  const handleCancelSubscription = async () => {
    try {
      await updateSubscription(billId, { isActive: false });
      dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: { ...subscription, isActive: false } });
      Alert.alert('Success', 'Subscription cancelled');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel subscription');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubscription(billId);
              await cancelBillReminder(billId);
              dispatch({ type: 'DELETE_SUBSCRIPTION', payload: billId });
              onBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ]
    );
  };

  const targetDate = subscription.isAutoPayEnabled 
    ? subscription.nextBillingDate 
    : subscription.expiryDate;
  const dateLabel = subscription.isAutoPayEnabled ? 'Renews' : 'Expires';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Subscription Details</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionName}>{subscription.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {status === 'active' ? 'Active' : 
                 status === 'expiring-soon' ? 'Expiring Soon' : 
                 status === 'expired' ? 'Expired' : 'Cancelled'}
              </Text>
            </View>
          </View>

          <Text style={styles.subscriptionCategory}>
            {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
          </Text>

          <Text style={styles.subscriptionAmount}>
            {formatCurrency(subscription.amount, subscription.currency)}
          </Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Billing Cycle:</Text>
            <Text style={styles.detailValue}>
              {getBillingCycleText(subscription.billingCycle)}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Payment Type:</Text>
            <View style={[styles.billingBadge, { backgroundColor: billingColor }]}>
              <Text style={styles.billingBadgeText}>
                {subscription.isAutoPayEnabled ? 'Auto-pay' : 'Manual'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{dateLabel}:</Text>
            <Text style={styles.detailValue}>{formatDate(targetDate)}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Reminder:</Text>
            <Text style={styles.detailValue}>
              {subscription.reminderTime} day{subscription.reminderTime > 1 ? 's' : ''} before
            </Text>
          </View>

          {subscription.provider && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Provider:</Text>
              <Text style={styles.detailValue}>{subscription.provider}</Text>
            </View>
          )}

          {subscription.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{subscription.description}</Text>
            </View>
          )}
        </View>

        {subscription.isActive && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
            <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Subscription</Text>
        </TouchableOpacity>
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
  editButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  subscriptionAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  billingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  billingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BillDetailScreen;
