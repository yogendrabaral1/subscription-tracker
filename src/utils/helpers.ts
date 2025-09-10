import { Subscription, SubscriptionStatus, BillingStatus, CategoryBreakdown } from '../types';

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const calculateMonthlySpending = (subscriptions: Subscription[]): number => {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      
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

export const getUpcomingRenewals = (subscriptions: Subscription[]): Subscription[] => {
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return subscriptions
    .filter(sub => {
      if (!sub.isActive) return false;
      
      const targetDate = sub.isAutoPayEnabled ? sub.nextBillingDate : sub.expiryDate;
      if (!targetDate) return false;
      
      const date = new Date(targetDate);
      return date >= now && date <= next30Days;
    })
    .sort((a, b) => {
      const dateA = new Date(a.isAutoPayEnabled ? a.nextBillingDate! : a.expiryDate!);
      const dateB = new Date(b.isAutoPayEnabled ? b.nextBillingDate! : b.expiryDate!);
      return dateA.getTime() - dateB.getTime();
    });
};

export const getExpiringSoon = (subscriptions: Subscription[]): Subscription[] => {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return subscriptions
    .filter(sub => {
      if (!sub.isActive || sub.isAutoPayEnabled) return false;
      
      if (!sub.expiryDate) return false;
      
      const date = new Date(sub.expiryDate);
      return date >= now && date <= next7Days;
    })
    .sort((a, b) => {
      const dateA = new Date(a.expiryDate!);
      const dateB = new Date(b.expiryDate!);
      return dateA.getTime() - dateB.getTime();
    });
};

const getCategoryColor = (category: string): string => {
  const colors = [
    '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4',
    '#8BC34A', '#FFC107', '#795548', '#607D8B', '#E91E63', '#3F51B5'
  ];
  
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const getCategoryBreakdown = (subscriptions: Subscription[]): CategoryBreakdown[] => {
  const categoryMap = new Map<string, { amount: number; count: number }>();
  
  subscriptions
    .filter(sub => sub.isActive)
    .forEach(sub => {
      const monthlyAmount = calculateMonthlySpending([sub]);
      const existing = categoryMap.get(sub.category) || { amount: 0, count: 0 };
      categoryMap.set(sub.category, {
        amount: existing.amount + monthlyAmount,
        count: existing.count + 1,
      });
    });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: data.amount,
      count: data.count,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const getSubscriptionStatus = (subscription: Subscription): SubscriptionStatus => {
  if (!subscription.isActive) {
    return 'cancelled';
  }
  
  if (subscription.isAutoPayEnabled) {
    return 'active';
  }
  
  if (!subscription.expiryDate) {
    return 'active';
  }
  
  const now = new Date();
  const expiryDate = new Date(subscription.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 7) {
    return 'expiring-soon';
  } else {
    return 'active';
  }
};

export const getBillingStatus = (subscription: Subscription): BillingStatus => {
  if (!subscription.isActive) {
    return 'expired';
  }
  
  if (subscription.isAutoPayEnabled) {
    return 'auto-pay';
  } else {
    return 'manual';
  }
};

export const getStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return '#4CAF50';
    case 'expiring-soon':
      return '#FF9800';
    case 'expired':
      return '#F44336';
    case 'cancelled':
      return '#9E9E9E';
    default:
      return '#2196F3';
  }
};

export const getBillingStatusColor = (status: BillingStatus): string => {
  switch (status) {
    case 'auto-pay':
      return '#4CAF50';
    case 'manual':
      return '#FF9800';
    case 'expired':
      return '#9E9E9E';
    default:
      return '#2196F3';
  }
};

export const getDaysUntilNextBilling = (subscription: Subscription): number => {
  const targetDate = subscription.isAutoPayEnabled ? subscription.nextBillingDate : subscription.expiryDate;
  
  if (!targetDate) {
    return -1;
  }
  
  const now = new Date();
  const date = new Date(targetDate);
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
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
