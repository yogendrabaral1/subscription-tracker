import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Subscription, User, DashboardSummary } from '../types';
import { getAllSubscriptions, getUser, clearAllData } from '../services/database';
import { scheduleAllSubscriptionReminders } from '../services/notifications';
import { 
  calculateMonthlySpending, 
  calculateYearlySpending, 
  getUpcomingRenewals, 
  getExpiringSoon,
  getCategoryBreakdown 
} from '../utils/helpers';

export interface AppState {
  user: User | null;
  subscriptions: Subscription[];
  dashboardSummary: DashboardSummary | null;
  isLoading: boolean;
}

export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'DELETE_SUBSCRIPTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_SUMMARY'; payload: DashboardSummary | null }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  subscriptions: [],
  dashboardSummary: null,
  isLoading: true,
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
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        subscriptions: [],
        dashboardSummary: {
          totalMonthlySpending: 0,
          totalYearlySpending: 0,
          activeSubscriptions: 0,
          upcomingRenewals: [],
          expiringSoon: [],
          monthlyBreakdown: [],
        },
        isLoading: false,
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Add minimum loading duration to ensure splash screen is visible
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds
        
        const [user, subscriptions] = await Promise.all([
          getUser(),
          getAllSubscriptions(),
        ]);

        // Wait for minimum loading time before setting data
        await minLoadingTime;

        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_SUBSCRIPTIONS', payload: subscriptions });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Recalculate dashboard summary whenever subscriptions change
  useEffect(() => {
    if (state.subscriptions.length > 0) {
      const summary = calculateDashboardSummary(state.subscriptions);
      dispatch({ type: 'SET_DASHBOARD_SUMMARY', payload: summary });
      
      // Schedule notifications for manual subscriptions
      scheduleAllSubscriptionReminders(state.subscriptions);
    } else {
      // Create empty summary for when there are no subscriptions
      const emptySummary: DashboardSummary = {
        totalMonthlySpending: 0,
        totalYearlySpending: 0,
        activeSubscriptions: 0,
        upcomingRenewals: [],
        expiringSoon: [],
        monthlyBreakdown: [],
      };
      dispatch({ type: 'SET_DASHBOARD_SUMMARY', payload: emptySummary });
    }
  }, [state.subscriptions]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Helper function to calculate dashboard summary
const calculateDashboardSummary = (subscriptions: Subscription[]): DashboardSummary => {
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  
  return {
    totalMonthlySpending: calculateMonthlySpending(activeSubscriptions),
    totalYearlySpending: calculateYearlySpending(activeSubscriptions),
    activeSubscriptions: activeSubscriptions.length,
    upcomingRenewals: getUpcomingRenewals(activeSubscriptions),
    expiringSoon: getExpiringSoon(activeSubscriptions),
    monthlyBreakdown: getCategoryBreakdown(activeSubscriptions),
  };
};
