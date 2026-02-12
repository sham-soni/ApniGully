import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@/contexts/AuthContext';
import { MainTabs } from './MainTabs';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OtpScreen } from '@/screens/auth/OtpScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { NeighborhoodSelectScreen } from '@/screens/auth/NeighborhoodSelectScreen';
import { PostDetailScreen } from '@/screens/PostDetailScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { HelperProfileScreen } from '@/screens/HelperProfileScreen';
import { ShopDetailScreen } from '@/screens/ShopDetailScreen';
import { RentalDetailScreen } from '@/screens/RentalDetailScreen';
import { CreatePostScreen } from '@/screens/CreatePostScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { EditNeighborhoodsScreen } from '@/screens/EditNeighborhoodsScreen';
import { BlockedUsersScreen } from '@/screens/BlockedUsersScreen';
import { PrivacySettingsScreen } from '@/screens/PrivacySettingsScreen';
import { colors } from '@/theme';

export type RootStackParamList = {
  Login: undefined;
  Otp: { phone: string };
  Onboarding: undefined;
  NeighborhoodSelect: undefined;
  MainTabs: undefined;
  PostDetail: { id: string };
  Chat: { id: string; name?: string };
  HelperProfile: { id: string };
  ShopDetail: { id: string };
  RentalDetail: { id: string };
  CreatePost: { type?: string };
  Settings: undefined;
  EditProfile: undefined;
  EditNeighborhoods: undefined;
  BlockedUsers: undefined;
  PrivacySettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, token } = useAuth();
  const isAuthenticated = !!token && !!user;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </>
      ) : !user?.name ? (
        // Onboarding Stack
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="NeighborhoodSelect" component={NeighborhoodSelectScreen} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{
              headerShown: true,
              title: 'Post',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.name || 'Chat',
              headerTintColor: colors.primary[600],
            })}
          />
          <Stack.Screen
            name="HelperProfile"
            component={HelperProfileScreen}
            options={{
              headerShown: true,
              title: 'Helper',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="ShopDetail"
            component={ShopDetailScreen}
            options={{
              headerShown: true,
              title: 'Shop',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              headerShown: true,
              title: 'Create Post',
              headerTintColor: colors.primary[600],
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Settings',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: 'Edit Profile',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="RentalDetail"
            component={RentalDetailScreen}
            options={{
              headerShown: true,
              title: 'Rental',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="EditNeighborhoods"
            component={EditNeighborhoodsScreen}
            options={{
              headerShown: true,
              title: 'My Neighborhoods',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="BlockedUsers"
            component={BlockedUsersScreen}
            options={{
              headerShown: true,
              title: 'Blocked Users',
              headerTintColor: colors.primary[600],
            }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{
              headerShown: true,
              title: 'Privacy Settings',
              headerTintColor: colors.primary[600],
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
