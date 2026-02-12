import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

interface PrivacySettings {
  profileVisibility: 'neighbors' | 'public';
  showPhone: boolean;
  showOnlineStatus: boolean;
  showLocation: boolean;
}

export function PrivacySettingsScreen() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'neighbors',
    showPhone: false,
    showOnlineStatus: true,
    showLocation: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/users/me/settings');
      if (response.data.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      // Use default settings if API fails
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: boolean | string) => {
    const previousSettings = { ...settings };
    setSettings({ ...settings, [key]: value });
    setIsSaving(true);

    try {
      await api.put('/users/me/settings', { [key]: value });
    } catch (error) {
      // Revert on error
      setSettings(previousSettings);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingToggle = ({
    icon,
    title,
    description,
    value,
    onToggle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    value: boolean;
    onToggle: (val: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.neutral[600]} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
        thumbColor={colors.white}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Saving Indicator */}
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      {/* Profile Visibility Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Profile Visibility</Text>
        <View style={styles.visibilityOption}>
          <View style={styles.settingIcon}>
            <Ionicons name="eye-outline" size={20} color={colors.neutral[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Who can see your profile</Text>
            <Text style={styles.settingDescription}>
              Control who can view your profile information
            </Text>
          </View>
        </View>
        <View style={styles.visibilityButtons}>
          <TouchableOpacity
            style={[
              styles.visibilityButton,
              settings.profileVisibility === 'neighbors' && styles.visibilityButtonActive,
            ]}
            onPress={() => updateSetting('profileVisibility', 'neighbors')}
          >
            <Ionicons
              name="people"
              size={20}
              color={settings.profileVisibility === 'neighbors' ? colors.primary[600] : colors.neutral[400]}
            />
            <Text
              style={[
                styles.visibilityButtonText,
                settings.profileVisibility === 'neighbors' && styles.visibilityButtonTextActive,
              ]}
            >
              Neighbors Only
            </Text>
            <Text style={styles.visibilityButtonHint}>
              Members of your neighborhood
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.visibilityButton,
              settings.profileVisibility === 'public' && styles.visibilityButtonActive,
            ]}
            onPress={() => updateSetting('profileVisibility', 'public')}
          >
            <Ionicons
              name="globe"
              size={20}
              color={settings.profileVisibility === 'public' ? colors.primary[600] : colors.neutral[400]}
            />
            <Text
              style={[
                styles.visibilityButtonText,
                settings.profileVisibility === 'public' && styles.visibilityButtonTextActive,
              ]}
            >
              Public
            </Text>
            <Text style={styles.visibilityButtonHint}>
              Anyone on ApniGully
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Information Sharing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Information Sharing</Text>
        <SettingToggle
          icon="call-outline"
          title="Show Phone Number"
          description="Allow others to see your phone number on your profile"
          value={settings.showPhone}
          onToggle={(val) => updateSetting('showPhone', val)}
        />
        <SettingToggle
          icon="radio-outline"
          title="Show Online Status"
          description="Let others see when you're active on ApniGully"
          value={settings.showOnlineStatus}
          onToggle={(val) => updateSetting('showOnlineStatus', val)}
        />
        <SettingToggle
          icon="location-outline"
          title="Show Location"
          description="Show your approximate location on posts and profile"
          value={settings.showLocation}
          onToggle={(val) => updateSetting('showLocation', val)}
        />
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Privacy on ApniGully</Text>
          <Text style={styles.infoText}>
            Your safety and privacy are important to us. These settings help you
            control what information is shared with others. Some features may be
            limited based on your privacy settings.
          </Text>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
  },
  savingText: {
    fontSize: fontSizes.sm,
    color: colors.primary[600],
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.neutral[900],
  },
  settingDescription: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  visibilityButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  visibilityButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
  },
  visibilityButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  visibilityButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  visibilityButtonTextActive: {
    color: colors.primary[700],
  },
  visibilityButtonHint: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[800],
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSizes.sm,
    color: colors.primary[700],
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing['3xl'],
  },
});
