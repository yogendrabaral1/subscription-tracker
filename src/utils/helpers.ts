import { Subscription, SubscriptionStatus, BillingStatus, CategoryBreakdown } from '../types';

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
  };
  
  const symbol = symbols[currency] || '₹';
  
  if (currency === 'INR') {
    // Indian number formatting with lakhs and crores
    return `₹${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  } else {
    // Standard formatting for other currencies
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getSubscriptionStatus = (subscription: Subscription): SubscriptionStatus => {
  if (!subscription.isActive) return 'cancelled';
  
  const now = new Date();
  const targetDate = subscription.isAutoPayEnabled 
    ? new Date(subscription.nextBillingDate)
    : new Date(subscription.expiryDate);
  
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring-soon';
  return 'active';
};

export const getBillingStatus = (subscription: Subscription): BillingStatus => {
  if (!subscription.isActive) return 'expired';
  if (subscription.isAutoPayEnabled) return 'auto-pay';
  return 'manual';
};

export const getStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return '#4CAF50'; // Green
    case 'expiring-soon':
      return '#FF9800'; // Orange
    case 'expired':
      return '#F44336'; // Red
    case 'cancelled':
      return '#9E9E9E'; // Gray
    default:
      return '#757575';
  }
};

export const getBillingStatusColor = (status: BillingStatus): string => {
  switch (status) {
    case 'auto-pay':
      return '#2196F3'; // Blue
    case 'manual':
      return '#FF9800'; // Orange
    case 'expired':
      return '#F44336'; // Red
    default:
      return '#757575';
  }
};

export const getDaysUntilNextBilling = (subscription: Subscription): number => {
  const targetDate = subscription.isAutoPayEnabled 
    ? new Date(subscription.nextBillingDate)
    : new Date(subscription.expiryDate);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateMonthlySpending = (subscriptions: Subscription[]): number => {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      
      // Convert to monthly amount based on billing cycle
      switch (sub.billingCycle) {
        case 'weekly':
          monthlyAmount = sub.amount * 4.33; // Average weeks per month
          break;
        case 'monthly':
          monthlyAmount = sub.amount;
          break;
        case 'quarterly':
          monthlyAmount = sub.amount / 3;
          break;
        case 'yearly':
          monthlyAmount = sub.amount / 12;
          break;
      }
      
      return total + monthlyAmount;
    }, 0);
};

export const calculateYearlySpending = (subscriptions: Subscription[]): number => {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      let yearlyAmount = sub.amount;
      
      // Convert to yearly amount based on billing cycle
      switch (sub.billingCycle) {
        case 'weekly':
          yearlyAmount = sub.amount * 52;
          break;
        case 'monthly':
          yearlyAmount = sub.amount * 12;
          break;
        case 'quarterly':
          yearlyAmount = sub.amount * 4;
          break;
        case 'yearly':
          yearlyAmount = sub.amount;
          break;
      }
      
      return total + yearlyAmount;
    }, 0);
};

export const getUpcomingRenewals = (subscriptions: Subscription[], days: number = 30): Subscription[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return subscriptions
    .filter(sub => {
      if (!sub.isActive || !sub.isAutoPayEnabled) return false;
      
      const nextBilling = new Date(sub.nextBillingDate);
      return nextBilling >= now && nextBilling <= futureDate;
    })
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
};

export const getExpiringSoon = (subscriptions: Subscription[], days: number = 30): Subscription[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return subscriptions
    .filter(sub => {
      if (!sub.isActive || sub.isAutoPayEnabled) return false;
      
      const expiryDate = new Date(sub.expiryDate);
      return expiryDate >= now && expiryDate <= futureDate;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
};

export const getCategoryBreakdown = (subscriptions: Subscription[]): CategoryBreakdown[] => {
  const categoryColors: { [key: string]: string } = {
    entertainment: '#E91E63',
    productivity: '#2196F3',
    fitness: '#4CAF50',
    news: '#FF9800',
    cloud: '#9C27B0',
    other: '#607D8B',
  };

  const breakdown: { [key: string]: { amount: number; count: number } } = {};
  
  subscriptions
    .filter(sub => sub.isActive)
    .forEach(sub => {
      const monthlyAmount = getMonthlyAmount(sub);
      
      if (!breakdown[sub.category]) {
        breakdown[sub.category] = { amount: 0, count: 0 };
      }
      
      breakdown[sub.category].amount += monthlyAmount;
      breakdown[sub.category].count += 1;
    });

  return Object.entries(breakdown).map(([category, data]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    amount: data.amount,
    count: data.count,
    color: categoryColors[category] || '#607D8B',
  }));
};

const getMonthlyAmount = (subscription: Subscription): number => {
  switch (subscription.billingCycle) {
    case 'weekly':
      return subscription.amount * 4.33;
    case 'monthly':
      return subscription.amount;
    case 'quarterly':
      return subscription.amount / 3;
    case 'yearly':
      return subscription.amount / 12;
    default:
      return subscription.amount;
  }
};

export const getBillingCycleText = (cycle: string): string => {
  switch (cycle) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    default:
      return cycle;
  }
};
