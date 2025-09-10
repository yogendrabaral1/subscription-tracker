import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { saveUser } from '../services/database';

interface LoginScreenProps {
  onLogin: () => void;
  onGuestMode: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuestMode }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { dispatch } = useApp();

  const handleEmailLogin = async () => {
    if (!email.trim() || !name.trim()) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    try {
      const user = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
        defaultReminderTime: 1,
        theme: 'light' as const,
        currency: 'INR',
      };

      await saveUser(user);
      dispatch({ type: 'SET_USER', payload: user });
      onLogin();
    } catch (error) {
      Alert.alert('Error', 'Failed to save user data');
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder for Google login
    Alert.alert('Coming Soon', 'Google login will be available in the next update');
  };

  const handleAppleLogin = () => {
    // Placeholder for Apple login
    Alert.alert('Coming Soon', 'Apple login will be available in the next update');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to SubscriptionTracker</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.emailButton} onPress={handleEmailLogin}>
            <Text style={styles.emailButtonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appleButton} onPress={handleAppleLogin}>
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onGuestMode}>
            <Text style={styles.guestText}>Skip (Guest Mode)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  form: {
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emailButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  emailButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  appleButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  switchText: {
    color: '#2196F3',
    fontSize: 16,
    marginBottom: 20,
  },
  guestText: {
    color: '#666',
    fontSize: 16,
  },
});

export default LoginScreen;
