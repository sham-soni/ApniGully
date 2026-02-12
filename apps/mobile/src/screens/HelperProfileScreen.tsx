import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatTimeAgo, getTrustLevel } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/theme';

type HelperProfileRouteProp = RouteProp<RootStackParamList, 'HelperProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HelperProfileScreen() {
  const route = useRoute<HelperProfileRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [helper, setHelper] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContacting, setIsContacting] = useState(false);

  const { id } = route.params;

  useEffect(() => {
    fetchHelper();
  }, [id]);

  const fetchHelper = async () => {
    try {
      const response = await api.get(`/helpers/${id}`);
      setHelper(response.data.data);
    } catch (error) {
      console.error('Failed to fetch helper:', error);
      Alert.alert('Error', 'Failed to load helper profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async () => {
    setIsContacting(true);
    try {
      const response = await api.post('/chats', {
        participantId: helper.userId,
        helperProfileId: id,
      });
      navigation.navigate('Chat', { id: response.data.id, name: helper.user?.name });
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setIsContacting(false);
    }
  };

  const handleEndorse = async () => {
    try {
      await api.post(`/helpers/${id}/endorse`);
      Alert.alert('Success', 'Endorsement added!');
      fetchHelper();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to endorse');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!helper) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Helper not found</Text>
      </View>
    );
  }

  const trustLevel = getTrustLevel(helper.user?.trustScore || 0);
  const avgRating = helper.reviews?.length
    ? (helper.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / helper.reviews.length).toFixed(1)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {helper.user?.name?.charAt(0).toUpperCase() || 'H'}
            </Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{helper.user?.name}</Text>
            {helper.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
            )}
          </View>

          <Text style={styles.category}>{helper.category}</Text>

          <View style={styles.statsRow}>
            {avgRating && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color={colors.warning[500]} />
                <Text style={styles.statValue}>{avgRating}</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons name="location" size={16} color={colors.neutral[500]} />
              <Text style={styles.statText}>{helper.areas?.join(', ') || 'Local'}</Text>
            </View>
          </View>

          {/* Trust Badge */}
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
              size={16}
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
              Trust Score: {helper.user?.trustScore || 0}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{helper._count?.tasks || 0}</Text>
            <Text style={styles.quickStatLabel}>Tasks</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{helper._count?.endorsements || 0}</Text>
            <Text style={styles.quickStatLabel}>Endorsements</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{helper.experience || '-'}y</Text>
            <Text style={styles.quickStatLabel}>Experience</Text>
          </View>
        </View>

        {/* Bio */}
        {helper.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{helper.bio}</Text>
          </View>
        )}

        {/* Services */}
        {helper.services?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.tagsRow}>
              {helper.services.map((service: string, idx: number) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pricing */}
        {helper.hourlyRate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <Text style={styles.priceText}>
              ₹{helper.hourlyRate}<Text style={styles.priceUnit}>/hour</Text>
            </Text>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {avgRating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={colors.warning[500]} />
                <Text style={styles.ratingText}>{avgRating} ({helper.reviews?.length})</Text>
              </View>
            )}
          </View>

          {(!helper.reviews || helper.reviews.length === 0) ? (
            <Text style={styles.emptyText}>No reviews yet</Text>
          ) : (
            helper.reviews.slice(0, 3).map((review: any) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerAvatarText}>
                      {review.reviewer?.name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.reviewer?.name}</Text>
                    <Text style={styles.reviewTime}>
                      {formatTimeAgo(new Date(review.createdAt))}
                    </Text>
                  </View>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={12}
                        color={colors.warning[500]}
                      />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewText}>{review.comment}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.endorseButton} onPress={handleEndorse}>
          <Ionicons name="thumbs-up" size={20} color={colors.primary[600]} />
          <Text style={styles.endorseButtonText}>Endorse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContact}
          disabled={isContacting}
        >
          <Ionicons name="chatbubble" size={20} color={colors.white} />
          <Text style={styles.contactButtonText}>
            {isContacting ? 'Starting...' : 'Contact'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  errorText: {
    fontSize: fontSizes.md,
    color: colors.neutral[500],
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
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
  category: {
    fontSize: fontSizes.md,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  statText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  trustBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  quickStatLabel: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  bioText: {
    fontSize: fontSizes.md,
    color: colors.neutral[600],
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.primary[700],
  },
  priceText: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.primary[600],
  },
  priceUnit: {
    fontSize: fontSizes.md,
    fontWeight: '400',
    color: colors.neutral[500],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[600],
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  reviewItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reviewerName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  reviewTime: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: spacing.md,
  },
  endorseButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  endorseButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[600],
  },
  contactButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  contactButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
});
