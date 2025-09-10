import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
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
import ChatBot from '../components/chatbot/ChatBot';
import ChatBotButton from '../components/chatbot/ChatBotButton';

interface DashboardScreenProps {
  onAddSubscription: () => void;
  onViewSubscription: (subscriptionId: string) => void;
  onSettings: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onAddSubscription, onViewSubscription, onSettings }) => {
  const { state, dispatch } = useApp();
  const theme = useTheme();
  const { dashboardSummary, subscriptions, user } = state;
  const [showChatBot, setShowChatBot] = useState(false);

  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000);
  };

  const styles = createStyles(theme);

  if (state.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showChatBot) {
    return <ChatBot onClose={() => setShowChatBot(false)} />;
  }

  const emptySummary = {
    totalMonthlySpending: 0,
    totalYearlySpending: 0,
    activeSubscriptions: 0,
    upcomingRenewals: [],
    expiringSoon: [],
    monthlyBreakdown: [],
  };

  const summary = dashboardSummary || emptySummary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>Hello, {user?.name || 'User'}!</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Manage your subscriptions</Text>
        </View>
        <TouchableOpacity onPress={onSettings} style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={state.isLoading} onRefresh={refreshData} />
        }
      >
        {/* ChatBot Button */}
        <ChatBotButton onPress={() => setShowChatBot(true)} />

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }, theme.shadows.md]}>
            <Text style={[styles.summaryTitle, { color: theme.colors.textSecondary }]}>Monthly Spending</Text>
            <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>
              {formatCurrency(summary.totalMonthlySpending, user?.currency || 'INR')}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }, theme.shadows.md]}>
            <Text style={[styles.summaryTitle, { color: theme.colors.textSecondary }]}>Yearly Spending</Text>
            <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>
              {formatCurrency(summary.totalYearlySpending, user?.currency || 'INR')}
            </Text>
          </View>
        </View>
        <View style={styles.activeSummaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }, theme.shadows.md]}>
            <Text style={[styles.summaryTitle, { color: theme.colors.textSecondary }]}>Active Subscriptions</Text>
            <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>{summary.activeSubscriptions}</Text>
          </View>
        </View>

        {/* Upcoming Renewals */}
        {summary.upcomingRenewals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 10 }]}>Upcoming Renewals</Text>
            {summary.upcomingRenewals.slice(0, 3).map((subscription) => {
              const hasDate = subscription.isAutoPayEnabled 
                ? subscription.nextBillingDate 
                : subscription.expiryDate;
              
              return (
                <TouchableOpacity
                  key={subscription.id}
                  style={[styles.subscriptionCard, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}
                  onPress={() => onViewSubscription(subscription.id)}
                >
                  <View style={styles.subscriptionHeader}>
                    <Text style={[styles.subscriptionName, { color: theme.colors.text }]}>{subscription.name}</Text>
                    <Text style={[styles.subscriptionAmount, { color: theme.colors.text }]}>
                      {formatCurrency(subscription.amount, subscription.currency)}
                    </Text>
                  </View>
                  <View style={styles.subscriptionDetails}>
                    <Text style={[styles.subscriptionCategory, { color: theme.colors.textSecondary }]}>
                      {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
                    </Text>
                    {subscription.isAutoPayEnabled ? (
                      hasDate ? (
                        <Text style={[styles.subscriptionDate, { color: theme.colors.textSecondary }]}>
                          Renews {formatDate(hasDate)}
                        </Text>
                      ) : (
                        <Text style={[styles.subscriptionDate, { color: theme.colors.textSecondary }]}>
                          Auto-renewal enabled
                        </Text>
                      )
                    ) : (
                      <Text style={[styles.subscriptionDate, { color: theme.colors.textSecondary }]}>
                        Expires {formatDate(hasDate || '')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* All Subscriptions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>All Subscriptions</Text>
            <TouchableOpacity onPress={onAddSubscription} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          {subscriptions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}>
              <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No subscriptions yet</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                Add your first subscription to get started
              </Text>
              <TouchableOpacity onPress={onAddSubscription} style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.emptyStateButtonText}>Add Subscription</Text>
              </TouchableOpacity>
            </View>
          ) : (
            subscriptions.map((subscription) => {
              const status = getSubscriptionStatus(subscription);
              const billingStatus = getBillingStatus(subscription);
              const statusColor = getStatusColor(status);
              const billingColor = getBillingStatusColor(billingStatus);
              const hasDate = subscription.isAutoPayEnabled 
                ? subscription.nextBillingDate 
                : subscription.expiryDate;

              return (
                <TouchableOpacity
                  key={subscription.id}
                  style={[styles.subscriptionCard, { backgroundColor: theme.colors.surface }, theme.shadows.sm]}
                  onPress={() => onViewSubscription(subscription.id)}
                >
                  <View style={styles.subscriptionHeader}>
                    <Text style={[styles.subscriptionName, { color: theme.colors.text }]}>{subscription.name}</Text>
                    <View style={styles.subscriptionBadges}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>
                          {status === 'active' ? 'Active' : 
                           status === 'expiring-soon' ? 'Expiring Soon' : 
                           status === 'expired' ? 'Expired' : 'Cancelled'}
                        </Text>
                      </View>
                      <View style={[styles.billingBadge, { backgroundColor: billingColor }]}>
                        <Text style={styles.billingText}>
                          {subscription.isAutoPayEnabled ? 'Auto-pay' : 'Manual'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.subscriptionDetails}>
                    <Text style={[styles.subscriptionAmount, { color: theme.colors.text }]}>
                      {formatCurrency(subscription.amount, subscription.currency)}
                    </Text>
                    <Text style={[styles.subscriptionCycle, { color: theme.colors.textSecondary }]}>
                      {getBillingCycleText(subscription.billingCycle)}
                    </Text>
                  </View>
                  
                  <View style={styles.subscriptionFooter}>
                    <Text style={[styles.subscriptionCategory, { color: theme.colors.textSecondary }]}>
                      {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
                    </Text>
                    {subscription.isAutoPayEnabled ? (
                      hasDate ? (
                        <Text style={[styles.subscriptionDate, { color: theme.colors.textSecondary }]}>
                          Renews {formatDate(hasDate)}
                        </Text>
                      ) : (
                        <Text style={[styles.subscriptionDate, { color: theme.colors.textSecondary }]}>
                          Auto-renewal enabled
                        </Text>
                      )
                    ) : (
                      <Text style={[styles.subscriptionDate, { color: theme.colors.textSecondary }]}>
                        Expires {formatDate(hasDate || '')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  activeSummaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  subscriptionBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  billingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  billingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subscriptionCycle: {
    fontSize: 14,
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionCategory: {
    fontSize: 14,
  },
  subscriptionDate: {
    fontSize: 14,
  },
  emptyState: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
