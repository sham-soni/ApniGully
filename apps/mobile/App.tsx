import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { RootNavigator, RootStackParamList } from '@/navigation/RootNavigator';
import {
  registerForPushNotifications,
  addNotificationResponseReceivedListener,
  parseNotificationData,
  getNotificationNavigationTarget,
} from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading, token } = useAuth();
  const { resolvedTheme } = useTheme();
  const notificationResponseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    // Register for push notifications when authenticated
    if (token) {
      registerForPushNotifications();
    }
  }, [token]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const notificationResponseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Handle notification taps
    notificationResponseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = parseNotificationData(response);
      if (data && navigationRef.current) {
        const target = getNotificationNavigationTarget(data);
        if (target) {
          navigationRef.current.navigate(target.screen as any, target.params);
        }
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
