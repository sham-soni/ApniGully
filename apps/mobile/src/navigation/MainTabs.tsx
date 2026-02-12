import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FeedScreen } from '@/screens/FeedScreen';
import { DiscoverScreen } from '@/screens/DiscoverScreen';
import { InboxScreen } from '@/screens/InboxScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { colors, spacing } from '@/theme';

export type MainTabsParamList = {
  Feed: undefined;
  Discover: undefined;
  Inbox: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const tabIcons: Record<keyof MainTabsParamList, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Feed: { focused: 'home', unfocused: 'home-outline' },
  Discover: { focused: 'compass', unfocused: 'compass-outline' },
  Inbox: { focused: 'chatbubbles', unfocused: 'chatbubbles-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

export function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused
            ? tabIcons[route.name].focused
            : tabIcons[route.name].unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
