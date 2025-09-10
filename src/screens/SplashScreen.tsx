import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { initDatabase } from '../services/database';

const SplashScreen: React.FC = () => {
  const { dispatch } = useApp();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await initDatabase();
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error initializing app:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 BillTracker</Text>
      <Text style={styles.subtitle}>Never miss a payment again</Text>
      <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
