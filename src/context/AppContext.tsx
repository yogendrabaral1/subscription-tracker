import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Subscription, User, DashboardSummary } from '../types';
import { getAllSubscriptions, getUser } from '../services/database';
import { scheduleAllBillReminders } from '../services/notifications';
import { 
  calculateMonthlySpending, 
  calculateYearlySpending, 
  getUpcomingRenewals, 
  getExpiringSoon,
  getCategoryBreakdown 
} from '../utils/helpers';

interface AppState {
  user: User | null;
  subscriptions: Subscription[];
  isLoading: boolean;
  dashboardSummary: DashboardSummary | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'DELETE_SUBSCRIPTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_SUMMARY'; payload: DashboardSummary };

const initialState: AppState = {
  user: null,
  subscriptions: [],
  isLoading: true,
  dashboardSummary: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };
    case 'ADD_SUBSCRIPTION':
      return { ...state, subscriptions: [...state.subscriptions, action.payload] };
    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map(sub =>
          sub.id === action.payload.id ? action.payload : sub
        ),
      };
    case 'DELETE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.filter(sub => sub.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DASHBOARD_SUMMARY':
      return { ...state, dashboardSummary: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (state.subscriptions.length > 0) {
      // Convert subscriptions to bills format for notification service
      const bills = state.subscriptions.map(sub => ({
        id: sub.id,
        name: sub.name,
        category: 'subscription' as const,
        amount: sub.amount,
        dueDate: sub.isAutoPayEnabled ? sub.nextBillingDate : sub.expiryDate,
        frequency: sub.billingCycle === 'monthly' ? 'monthly' as const : 
                   sub.billingCycle === 'yearly' ? 'yearly' as const : 'custom' as const,
        reminderTime: sub.reminderTime,
        isPaid: false,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      }));
      scheduleAllBillReminders(bills);
    }
  }, [state.subscriptions]);

  const loadData = async () => {
    try {
      const [user, subscriptions] = await Promise.all([
        getUser(),
        getAllSubscriptions(),
      ]);
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_SUBSCRIPTIONS', payload: subscriptions });
      
      // Calculate dashboard summary
      const totalMonthlySpending = calculateMonthlySpending(subscriptions);
      const totalYearlySpending = calculateYearlySpending(subscriptions);
      const activeSubscriptions = subscriptions.filter(sub => sub.isActive).length;
      const upcomingRenewals = getUpcomingRenewals(subscriptions);
      const expiringSoon = getExpiringSoon(subscriptions);
      const monthlyBreakdown = getCategoryBreakdown(subscriptions);
      
      const dashboardSummary: DashboardSummary = {
        totalMonthlySpending,
        totalYearlySpending,
        activeSubscriptions,
        upcomingRenewals,
        expiringSoon,
        monthlyBreakdown,
      };
      
      dispatch({ type: 'SET_DASHBOARD_SUMMARY', payload: dashboardSummary });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
