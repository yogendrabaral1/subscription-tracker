import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { state } = useApp();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  if (state.isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => (
              <OnboardingScreen
                onComplete={() => setHasCompletedOnboarding(true)}
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
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="AddSubscription">
              {({ navigation }) => (
                <AddSubscriptionScreen
                  onSave={() => navigation.goBack()}
                  onCancel={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SubscriptionDetail">
              {({ navigation, route }) => (
                <BillDetailScreen
                  billId={route.params.subscriptionId}
                  onBack={() => navigation.goBack()}
                  onEdit={() => navigation.navigate('AddSubscription')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {({ navigation }) => (
                <SettingsScreen onBack={() => navigation.goBack()} />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
