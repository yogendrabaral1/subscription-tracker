import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { 
  formatCurrency, 
  formatDate, 
  getSubscriptionStatus, 
  getBillingStatus,
  getStatusColor, 
  getBillingStatusColor,
  getDaysUntilNextBilling,
  getBillingCycleText 
} from '../utils/helpers';
import { Subscription } from '../types';

interface DashboardScreenProps {
  onAddSubscription: () => void;
  onViewSubscription: (subscriptionId: string) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onAddSubscription, onViewSubscription }) => {
  const { state, dispatch } = useApp();
  const { dashboardSummary, subscriptions, user } = state;

  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000);
  };

  const renderSubscriptionItem = (subscription: Subscription) => {
    const status = getSubscriptionStatus(subscription);
    const billingStatus = getBillingStatus(subscription);
    const statusColor = getStatusColor(status);
    const billingColor = getBillingStatusColor(billingStatus);
    const daysUntil = getDaysUntilNextBilling(subscription);
    const targetDate = subscription.isAutoPayEnabled 
      ? subscription.nextBillingDate 
      : subscription.expiryDate;
    const dateLabel = subscription.isAutoPayEnabled ? 'Renews' : 'Expires';

    return (
      <TouchableOpacity
        key={subscription.id}
        style={[styles.subscriptionItem, { borderLeftColor: statusColor }]}
        onPress={() => onViewSubscription(subscription.id)}
      >
        <View style={styles.subscriptionInfo}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionName}>{subscription.name}</Text>
            <View style={[styles.billingBadge, { backgroundColor: billingColor }]}>
              <Text style={styles.billingBadgeText}>
                {subscription.isAutoPayEnabled ? 'Auto-pay' : 'Manual'}
              </Text>
            </View>
          </View>
          <Text style={styles.subscriptionCategory}>
            {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
          </Text>
          <Text style={styles.subscriptionCycle}>
            {getBillingCycleText(subscription.billingCycle)}
          </Text>
        </View>
        <View style={styles.subscriptionDetails}>
          <Text style={styles.subscriptionAmount}>
            {formatCurrency(subscription.amount, subscription.currency)}
          </Text>
          <Text style={[styles.subscriptionDate, { color: statusColor }]}>
            {dateLabel} {formatDate(targetDate)}
          </Text>
          {daysUntil >= 0 && (
            <Text style={styles.subscriptionDays}>
              {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!dashboardSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={state.isLoading} onRefresh={refreshData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Track your subscription spending</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Monthly Spending</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(dashboardSummary.totalMonthlySpending, user?.currency || 'INR')}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Yearly Spending</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(dashboardSummary.totalYearlySpending, user?.currency || 'INR')}
            </Text>
          </View>
        </View>

        {/* Active Subscriptions Count */}
        <View style={styles.countCard}>
          <Text style={styles.countNumber}>{dashboardSummary.activeSubscriptions}</Text>
          <Text style={styles.countLabel}>Active Subscriptions</Text>
        </View>

        {/* Upcoming Renewals */}
        {dashboardSummary.upcomingRenewals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Upcoming Renewals</Text>
            {dashboardSummary.upcomingRenewals.map(renderSubscriptionItem)}
          </View>
        )}

        {/* Expiring Soon */}
        {dashboardSummary.expiringSoon.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Expiring Soon</Text>
            {dashboardSummary.expiringSoon.map(renderSubscriptionItem)}
          </View>
        )}

        {/* All Subscriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Subscriptions</Text>
          {subscriptions.length > 0 ? (
            subscriptions.map(renderSubscriptionItem)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No subscriptions yet</Text>
              <Text style={styles.emptySubtext}>Add your first subscription to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={onAddSubscription}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 16,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryAmount: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  countCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  countLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  subscriptionItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  subscriptionInfo: {
    flex: 1,
    marginBottom: 8,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
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
  subscriptionCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  subscriptionCycle: {
    fontSize: 12,
    color: '#999',
  },
  subscriptionDetails: {
    alignItems: 'flex-end',
  },
  subscriptionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subscriptionDate: {
    fontSize: 14,
    marginTop: 2,
  },
  subscriptionDays: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
