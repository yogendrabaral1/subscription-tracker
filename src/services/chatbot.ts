import { Subscription, DashboardSummary } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

export interface ChatResponse {
  text: string;
  suggestions?: string[];
  action?: 'navigate' | 'add_subscription' | 'view_subscription';
  data?: any;
}

export class ChatBotService {
  private subscriptions: Subscription[];
  private dashboardSummary: DashboardSummary | null;
  private userCurrency: string;

  constructor(subscriptions: Subscription[], dashboardSummary: DashboardSummary | null, userCurrency: string = 'INR') {
    this.subscriptions = subscriptions;
    this.dashboardSummary = dashboardSummary;
    this.userCurrency = userCurrency;
  }

  processMessage(userMessage: string): ChatResponse {
    const message = userMessage.toLowerCase().trim();
    
    // Greeting patterns
    if (this.matchesPattern(message, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return {
        text: "Hello! I'm your subscription assistant. How can I help you manage your subscriptions today?",
        suggestions: ['Show my spending', 'Upcoming renewals', 'Add subscription', 'Help']
      };
    }
    
    // Help patterns
    if (this.matchesPattern(message, ['help', 'what can you do', 'commands', 'options'])) {
      return {
        text: `I can help you with:
• 💰 View spending summaries and breakdowns
• 📅 Check upcoming renewals and expiring subscriptions
• 📋 List and manage your subscriptions
• ➕ Add new subscriptions
• 📊 Get spending insights by category
• 🔍 Find specific subscriptions
• ❓ Answer questions about your data

What would you like to know?`,
        suggestions: ['Show spending', 'List subscriptions', 'Upcoming renewals', 'Category breakdown']
      };
    }
    
    // Spending queries
    if (this.matchesPattern(message, ['spending', 'spend', 'total', 'cost', 'money', 'budget'])) {
      return this.getSpendingResponse();
    }
    
    // Upcoming renewals
    if (this.matchesPattern(message, ['upcoming', 'renewal', 'due', 'next', 'soon', 'billing'])) {
      return this.getUpcomingRenewalsResponse();
    }
    
    // Subscription count
    if (this.matchesPattern(message, ['how many', 'count', 'subscriptions', 'total subscriptions'])) {
      return this.getSubscriptionCountResponse();
    }
    
    // Category breakdown
    if (this.matchesPattern(message, ['category', 'breakdown', 'by category', 'categories', 'spending by category'])) {
      return this.getCategoryBreakdownResponse();
    }
    
    // Expiring soon
    if (this.matchesPattern(message, ['expiring', 'expire', 'soon', 'ending', 'expired'])) {
      return this.getExpiringSoonResponse();
    }
    
    // Add subscription
    if (this.matchesPattern(message, ['add', 'new subscription', 'create', 'subscribe'])) {
      return {
        text: "I can help you add a new subscription! Tap the '+' button on the dashboard or use the 'Add Subscription' option in the menu.",
        suggestions: ['Show me how', 'What do I need?', 'Go to dashboard']
      };
    }
    
    // List all subscriptions
    if (this.matchesPattern(message, ['list', 'show all', 'all subscriptions', 'my subscriptions', 'subscriptions'])) {
      return this.getSubscriptionsListResponse();
    }
    
    // Find specific subscription
    if (this.matchesPattern(message, ['find', 'search', 'look for', 'where is'])) {
      return this.getSearchResponse(message);
    }
    
    // Analytics and insights
    if (this.matchesPattern(message, ['analytics', 'insights', 'analysis', 'report', 'summary'])) {
      return this.getAnalyticsResponse();
    }
    
    // Budget and savings
    if (this.matchesPattern(message, ['budget', 'save', 'savings', 'reduce', 'cut', 'cancel'])) {
      return this.getBudgetResponse();
    }
    
    // Default response
    return {
      text: "I'm not sure I understand. Try asking me about your spending, upcoming renewals, or subscription count. You can also say 'help' to see what I can do!",
      suggestions: ['Help', 'Show spending', 'List subscriptions', 'Upcoming renewals']
    };
  }

  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  private getSpendingResponse(): ChatResponse {
    const monthly = this.dashboardSummary?.totalMonthlySpending || 0;
    const yearly = this.dashboardSummary?.totalYearlySpending || 0;
    const active = this.dashboardSummary?.activeSubscriptions || 0;
    
    return {
      text: `Here's your spending summary:
💰 Monthly: ${formatCurrency(monthly, this.userCurrency)}
💰 Yearly: ${formatCurrency(yearly, this.userCurrency)}
📊 Active subscriptions: ${active}
${monthly > 0 ? `\n💡 That's about ${formatCurrency(monthly / 30, this.userCurrency)} per day` : ''}`,
      suggestions: ['Category breakdown', 'Upcoming renewals', 'Analytics', 'Budget tips']
    };
  }

  private getUpcomingRenewalsResponse(): ChatResponse {
    const upcoming = this.dashboardSummary?.upcomingRenewals || [];
    
    if (upcoming.length === 0) {
      return {
        text: "Great news! You have no upcoming renewals in the next 30 days. 🎉",
        suggestions: ['Show all subscriptions', 'Add subscription', 'Spending summary']
      };
    }
    
    let text = `You have ${upcoming.length} upcoming renewal${upcoming.length > 1 ? 's' : ''}:\n\n`;
    
    upcoming.slice(0, 5).forEach((sub, index) => {
      const date = sub.nextBillingDate || sub.expiryDate;
      const daysUntil = date ? this.getDaysUntil(date) : 0;
      text += `${index + 1}. ${sub.name} - ${formatCurrency(sub.amount, sub.currency)}`;
      if (date) {
        text += ` (${daysUntil} days - ${formatDate(date)})`;
      }
      text += '\n';
    });
    
    if (upcoming.length > 5) {
      text += `\n... and ${upcoming.length - 5} more`;
    }
    
    return {
      text,
      suggestions: ['Show all', 'Spending summary', 'Category breakdown']
    };
  }

  private getSubscriptionCountResponse(): ChatResponse {
    const total = this.subscriptions.length;
    const active = this.subscriptions.filter(s => s.isActive).length;
    const autoPay = this.subscriptions.filter(s => s.isAutoPayEnabled && s.isActive).length;
    const manual = this.subscriptions.filter(s => !s.isAutoPayEnabled && s.isActive).length;
    
    return {
      text: `Your subscription overview:
📊 Total: ${total} subscriptions
✅ Active: ${active}
🔄 Auto-pay: ${autoPay}
✋ Manual: ${manual}
${total === 0 ? '\n💡 Add your first subscription to get started!' : ''}`,
      suggestions: ['List all', 'Add subscription', 'Spending summary']
    };
  }

  private getCategoryBreakdownResponse(): ChatResponse {
    const breakdown = this.dashboardSummary?.monthlyBreakdown || [];
    
    if (breakdown.length === 0) {
      return {
        text: "No category breakdown available yet. Add some subscriptions to see your spending by category!",
        suggestions: ['Add subscription', 'Show spending', 'List subscriptions']
      };
    }
    
    let text = "Your spending by category:\n\n";
    breakdown.forEach((category, index) => {
      text += `${index + 1}. ${category.category}: ${formatCurrency(category.amount, this.userCurrency)} (${category.count} subscription${category.count > 1 ? 's' : ''})\n`;
    });
    
    return {
      text,
      suggestions: ['Show spending', 'Upcoming renewals', 'Analytics']
    };
  }

  private getExpiringSoonResponse(): ChatResponse {
    const expiring = this.dashboardSummary?.expiringSoon || [];
    
    if (expiring.length === 0) {
      return {
        text: "No subscriptions are expiring soon. You're all set! ✅",
        suggestions: ['Upcoming renewals', 'Show spending', 'List subscriptions']
      };
    }
    
    let text = `You have ${expiring.length} subscription${expiring.length > 1 ? 's' : ''} expiring soon:\n\n`;
    expiring.forEach((sub, index) => {
      const date = sub.expiryDate;
      const daysUntil = date ? this.getDaysUntil(date) : 0;
      text += `${index + 1}. ${sub.name} - ${formatCurrency(sub.amount, sub.currency)}`;
      if (date) {
        text += ` (${daysUntil} days - ${formatDate(date)})`;
      }
      text += '\n';
    });
    
    return {
      text,
      suggestions: ['Renew now', 'Show all', 'Spending summary']
    };
  }

  private getSubscriptionsListResponse(): ChatResponse {
    if (this.subscriptions.length === 0) {
      return {
        text: "You don't have any subscriptions yet. Add your first one to get started!",
        suggestions: ['Add subscription', 'Help', 'Show spending']
      };
    }
    
    let text = `Your ${this.subscriptions.length} subscription${this.subscriptions.length > 1 ? 's' : ''}:\n\n`;
    
    this.subscriptions.forEach((sub, index) => {
      text += `${index + 1}. ${sub.name} - ${formatCurrency(sub.amount, sub.currency)}`;
      if (sub.isAutoPayEnabled) {
        text += " (Auto-pay)";
      } else {
        text += " (Manual)";
      }
      if (sub.isActive) {
        text += " ✅";
      } else {
        text += " ❌";
      }
      text += '\n';
    });
    
    return {
      text,
      suggestions: ['Spending summary', 'Upcoming renewals', 'Category breakdown']
    };
  }

  private getSearchResponse(message: string): ChatResponse {
    const searchTerm = message.replace(/find|search|look for|where is/gi, '').trim();
    
    if (!searchTerm) {
      return {
        text: "What would you like me to search for? Try saying 'find Netflix' or 'search for Spotify'.",
        suggestions: ['List all', 'Show spending', 'Help']
      };
    }
    
    const results = this.subscriptions.filter(sub => 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.provider && sub.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    if (results.length === 0) {
      return {
        text: `No subscriptions found matching "${searchTerm}". Try a different search term.`,
        suggestions: ['List all', 'Show spending', 'Help']
      };
    }
    
    let text = `Found ${results.length} subscription${results.length > 1 ? 's' : ''} matching "${searchTerm}":\n\n`;
    results.forEach((sub, index) => {
      text += `${index + 1}. ${sub.name} - ${formatCurrency(sub.amount, sub.currency)}\n`;
    });
    
    return {
      text,
      suggestions: ['Show spending', 'Upcoming renewals', 'List all']
    };
  }

  private getAnalyticsResponse(): ChatResponse {
    const monthly = this.dashboardSummary?.totalMonthlySpending || 0;
    const yearly = this.dashboardSummary?.totalYearlySpending || 0;
    const active = this.dashboardSummary?.activeSubscriptions || 0;
    const breakdown = this.dashboardSummary?.monthlyBreakdown || [];
    
    let text = `📊 Your Subscription Analytics:\n\n`;
    text += `💰 Monthly Spending: ${formatCurrency(monthly, this.userCurrency)}\n`;
    text += `💰 Yearly Spending: ${formatCurrency(yearly, this.userCurrency)}\n`;
    text += `📊 Active Subscriptions: ${active}\n`;
    
    if (breakdown.length > 0) {
      text += `\n📈 Top Categories:\n`;
      breakdown.slice(0, 3).forEach((category, index) => {
        text += `${index + 1}. ${category.category}: ${formatCurrency(category.amount, this.userCurrency)}\n`;
      });
    }
    
    return {
      text,
      suggestions: ['Category breakdown', 'Spending summary', 'Upcoming renewals']
    };
  }

  private getBudgetResponse(): ChatResponse {
    const monthly = this.dashboardSummary?.totalMonthlySpending || 0;
    const breakdown = this.dashboardSummary?.monthlyBreakdown || [];
    
    if (monthly === 0) {
      return {
        text: "You don't have any subscriptions yet, so no budget concerns! Add some subscriptions to start tracking your spending.",
        suggestions: ['Add subscription', 'Help', 'Show spending']
      };
    }
    
    let text = `💡 Budget Tips for Your Subscriptions:\n\n`;
    text += `💰 Current monthly spending: ${formatCurrency(monthly, this.userCurrency)}\n\n`;
    
    if (breakdown.length > 0) {
      const topCategory = breakdown[0];
      text += `📊 Highest spending category: ${topCategory.category} (${formatCurrency(topCategory.amount, this.userCurrency)})\n\n`;
    }
    
    text += `💡 Tips to save money:\n`;
    text += `• Review unused subscriptions\n`;
    text += `• Consider annual plans for savings\n`;
    text += `• Set spending alerts\n`;
    text += `• Cancel duplicate services\n`;
    
    return {
      text,
      suggestions: ['List subscriptions', 'Show spending', 'Upcoming renewals']
    };
  }

  private getDaysUntil(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
