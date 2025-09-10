export interface Subscription {
  id: string;
  name: string;
  category: 'entertainment' | 'productivity' | 'fitness' | 'news' | 'cloud' | 'other';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  nextBillingDate: string; // For auto-pay enabled subscriptions
  expiryDate: string; // For auto-pay disabled subscriptions
  isAutoPayEnabled: boolean;
  isActive: boolean;
  reminderTime: number; // days before due date
  createdAt: string;
  updatedAt: string;
  description?: string;
  provider?: string; // e.g., "Netflix", "Spotify", "Adobe"
}

export interface User {
  id: string;
  name: string;
  email: string;
  defaultReminderTime: number;
  theme: 'light' | 'dark';
  currency: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: number;
}

export interface DashboardSummary {
  totalMonthlySpending: number;
  totalYearlySpending: number;
  activeSubscriptions: number;
  upcomingRenewals: Subscription[];
  expiringSoon: Subscription[];
  monthlyBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  color: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Dashboard: undefined;
  AddSubscription: undefined;
  SubscriptionDetail: { subscriptionId: string };
  Settings: undefined;
  Analytics: undefined;
};

export type SubscriptionStatus = 'active' | 'expiring-soon' | 'expired' | 'cancelled';
export type BillingStatus = 'auto-pay' | 'manual' | 'expired';
