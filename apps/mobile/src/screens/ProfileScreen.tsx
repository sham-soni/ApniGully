import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getTrustLevel } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
  trustScore: number;
  bio?: string;
  _count: {
    posts: number;
    endorsementsReceived: number;
  };
  neighborhoods: Array<{
    neighborhood: {
      id: string;
      name: string;
    };
    role: string;
  }>;
}

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const trustLevel = getTrustLevel(profile?.trustScore || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.name || 'User'}</Text>
            {profile?.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
            )}
          </View>

          <Text style={styles.phone}>{profile?.phone}</Text>

          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={colors.primary[600]} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Score */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trust Score</Text>
          </View>
          <View style={styles.trustCard}>
            <View style={styles.trustScoreCircle}>
              <Text style={styles.trustScoreValue}>{profile?.trustScore || 0}</Text>
            </View>
            <View style={styles.trustInfo}>
              <View style={[
                styles.trustBadge,
                {
                  backgroundColor:
                    trustLevel === 'high' ? colors.success[50] :
                    trustLevel === 'medium' ? colors.warning[50] : colors.error[50],
                },
              ]}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={
                    trustLevel === 'high' ? colors.success[600] :
                    trustLevel === 'medium' ? colors.warning[600] : colors.error[600]
                  }
                />
                <Text style={[
                  styles.trustBadgeText,
                  {
                    color:
                      trustLevel === 'high' ? colors.success[600] :
                      trustLevel === 'medium' ? colors.warning[600] : colors.error[600],
                  },
                ]}>
                  {trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1)} Trust
                </Text>
              </View>
              <Text style={styles.trustDescription}>
                Based on verification, endorsements, and activity
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?._count?.posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?._count?.endorsementsReceived || 0}</Text>
            <Text style={styles.statLabel}>Endorsements</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.neighborhoods?.length || 0}</Text>
            <Text style={styles.statLabel}>Gullys</Text>
          </View>
        </View>

        {/* Neighborhoods */}
        {profile?.neighborhoods && profile.neighborhoods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Gullys</Text>
            {profile.neighborhoods.map((membership) => (
              <View key={membership.neighborhood.id} style={styles.neighborhoodItem}>
                <View style={styles.neighborhoodIcon}>
                  <Ionicons name="location" size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.neighborhoodInfo}>
                  <Text style={styles.neighborhoodName}>{membership.neighborhood.name}</Text>
                  <Text style={styles.neighborhoodRole}>{membership.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="star" size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionText}>My Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: colors.success[50] }]}>
                <Ionicons name="bookmark" size={24} color={colors.success[500]} />
              </View>
              <Text style={styles.actionText}>Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: colors.warning[50] }]}>
                <Ionicons name="notifications" size={24} color={colors.warning[500]} />
              </View>
              <Text style={styles.actionText}>Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: colors.error[50] }]}>
                <Ionicons name="help-circle" size={24} color={colors.error[500]} />
              </View>
              <Text style={styles.actionText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error[500]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  settingsButton: {
    padding: spacing.xs,
  },
  profileCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarLargeText: {
    fontSize: fontSizes['3xl'],
    fontWeight: '600',
    color: colors.primary[700],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  phone: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: fontSizes.md,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  editButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
  },
  trustScoreCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustScoreValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.white,
  },
  trustInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  trustBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  trustDescription: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral[200],
  },
  neighborhoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  neighborhoodIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  neighborhoodInfo: {
    marginLeft: spacing.md,
  },
  neighborhoodName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  neighborhoodRole: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionItem: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  logoutText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.error[500],
  },
  bottomPadding: {
    height: spacing['4xl'],
  },
});
