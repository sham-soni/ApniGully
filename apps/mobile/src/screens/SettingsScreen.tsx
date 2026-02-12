import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { spacing, fontSizes, borderRadius } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { colors, resolvedTheme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    push: true,
    messages: true,
    posts: true,
    safety: true,
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Delete Account',
      'This action cannot be undone. Type "DELETE" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async (value) => {
            if (value !== 'DELETE') {
              Alert.alert('Error', 'Please type DELETE to confirm');
              return;
            }
            try {
              await api.delete('/users/me');
              logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const SettingItem = ({
    icon,
    iconColor = colors.neutral[600],
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
    toggle,
    toggleValue,
    onToggle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border.light }]}
      onPress={toggle ? undefined : onPress}
      disabled={toggle}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? colors.error[50] : colors.neutral[100] }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error[500] : iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text.primary }, danger && { color: colors.error[500] }]}>
          {title}
        </Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.text.muted }]}>{subtitle}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
          thumbColor={colors.white}
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} showsVerticalScrollIndicator={false}>
      {/* Account Section */}
      <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.sectionHeader, { color: colors.text.muted, backgroundColor: colors.background.secondary }]}>Account</Text>
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Name, photo, bio"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <SettingItem
          icon="call-outline"
          title="Phone Number"
          subtitle={user?.phone || 'Not set'}
          onPress={() => Alert.alert('Phone Number', 'Your phone number is your primary identity on ApniGully and cannot be changed from the app. Contact support if you need to update it.')}
        />
        <SettingItem
          icon="location-outline"
          title="My Neighborhoods"
          subtitle="Manage your communities"
          onPress={() => navigation.navigate('EditNeighborhoods')}
        />
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.sectionHeader, { color: colors.text.muted, backgroundColor: colors.background.secondary }]}>Notifications</Text>
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          toggle
          toggleValue={notifications.push}
          onToggle={(value) => setNotifications({ ...notifications, push: value })}
        />
        <SettingItem
          icon="chatbubble-outline"
          title="Message Notifications"
          toggle
          toggleValue={notifications.messages}
          onToggle={(value) => setNotifications({ ...notifications, messages: value })}
        />
        <SettingItem
          icon="newspaper-outline"
          title="Post Notifications"
          toggle
          toggleValue={notifications.posts}
          onToggle={(value) => setNotifications({ ...notifications, posts: value })}
        />
        <SettingItem
          icon="shield-outline"
          iconColor={colors.error[500]}
          title="Safety Alerts"
          subtitle="Critical alerts for your area"
          toggle
          toggleValue={notifications.safety}
          onToggle={(value) => setNotifications({ ...notifications, safety: value })}
        />
      </View>

      {/* Preferences Section */}
      <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.sectionHeader, { color: colors.text.muted, backgroundColor: colors.background.secondary }]}>Preferences</Text>
        <SettingItem
          icon={resolvedTheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
          title="Dark Mode"
          subtitle={resolvedTheme === 'dark' ? 'Currently on' : 'Currently off'}
          toggle
          toggleValue={resolvedTheme === 'dark'}
          onToggle={toggleTheme}
        />
      </View>

      {/* Privacy Section */}
      <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.sectionHeader, { color: colors.text.muted, backgroundColor: colors.background.secondary }]}>Privacy & Security</Text>
        <SettingItem
          icon="lock-closed-outline"
          title="Privacy Settings"
          subtitle="Control who can see your info"
          onPress={() => navigation.navigate('PrivacySettings')}
        />
        <SettingItem
          icon="ban-outline"
          title="Blocked Users"
          onPress={() => navigation.navigate('BlockedUsers')}
        />
      </View>

      {/* Support Section */}
      <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.sectionHeader, { color: colors.text.muted, backgroundColor: colors.background.secondary }]}>Support</Text>
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="FAQs and guides"
          onPress={() => Linking.openURL('https://apnigully.com/help')}
        />
        <SettingItem
          icon="information-circle-outline"
          title="About ApniGully"
          subtitle="Version 1.0.0"
          onPress={() => Linking.openURL('https://apnigully.com/about')}
        />
      </View>

      {/* Account Actions */}
      <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.sectionHeader, { color: colors.text.muted, backgroundColor: colors.background.secondary }]}>Account Actions</Text>
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
          showArrow={false}
        />
        <SettingItem
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={handleDeleteAccount}
          danger
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  bottomPadding: {
    height: spacing['4xl'],
  },
});
