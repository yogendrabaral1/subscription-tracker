import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddSubscriptionScreen from '../screens/AddSubscriptionScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationTestScreen from '../screens/NotificationTestScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { state, dispatch } = useApp();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Show splash screen for minimum duration
        const splashPromise = new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds minimum
        
        // Check onboarding status
        const onboardingPromise = AsyncStorage.getItem('onboardingCompleted');
        
        // Wait for both splash duration and onboarding check
        const [, onboardingCompleted] = await Promise.all([
          splashPromise,
          onboardingPromise
        ]);
        
        setHasCompletedOnboarding(onboardingCompleted === 'true');
        setIsSplashVisible(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setHasCompletedOnboarding(false);
        setIsSplashVisible(false);
      }
    };

    initializeApp();
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('onboardingCompleted');
      setHasCompletedOnboarding(false);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error clearing onboarding status:', error);
    }
  };

  // Show splash screen while initializing
  if (isSplashVisible || hasCompletedOnboarding === null || state.isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => (
              <OnboardingScreen
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : !state.user ? (
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <LoginScreen
                onLogin={() => navigation.navigate('Dashboard')}
                onGuestMode={() => navigation.navigate('Dashboard')}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Dashboard">
              {({ navigation }) => (
                <DashboardScreen
                  onAddSubscription={() => navigation.navigate('AddSubscription')}
                  onViewSubscription={(subscriptionId) => navigation.navigate('SubscriptionDetail', { subscriptionId })}
                  onSettings={() => navigation.navigate('Settings')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="AddSubscription">
              {({ navigation, route }) => {
                const subscription = route.params?.subscription;
                return (
                  <AddSubscriptionScreen
                    onSave={() => navigation.goBack()}
                    onCancel={() => navigation.goBack()}
                    subscription={subscription}
                  />
                );
              }}
            </Stack.Screen>
            <Stack.Screen name="SubscriptionDetail">
              {({ navigation, route }) => {
                const subscription = state.subscriptions.find(s => s.id === route.params.subscriptionId);
                return (
                  <BillDetailScreen
                    billId={route.params.subscriptionId}
                    onBack={() => navigation.goBack()}
                    onEdit={() => navigation.navigate('AddSubscription', { subscription })}
                  />
                );
              }}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {({ navigation }) => (
                <SettingsScreen 
                  onBack={() => navigation.goBack()} 
                  onLogout={handleLogout}
                  onNotificationTest={() => navigation.navigate('NotificationTest')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="NotificationTest">
              {({ navigation }) => (
                <NotificationTestScreen 
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
