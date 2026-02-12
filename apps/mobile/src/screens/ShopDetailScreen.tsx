import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatTimeAgo } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type ShopDetailRouteProp = RouteProp<RootStackParamList, 'ShopDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ShopDetailScreen() {
  const route = useRoute<ShopDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContacting, setIsContacting] = useState(false);

  const { id } = route.params;

  useEffect(() => {
    fetchShop();
  }, [id]);

  const fetchShop = async () => {
    try {
      const response = await api.get(`/shops/${id}`);
      setShop(response.data.data);
    } catch (error) {
      console.error('Failed to fetch shop:', error);
      Alert.alert('Error', 'Failed to load shop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async () => {
    setIsContacting(true);
    try {
      const response = await api.post('/chats', {
        participantId: shop.ownerId,
        shopId: id,
      });
      navigation.navigate('Chat', { id: response.data.id, name: shop.name });
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setIsContacting(false);
    }
  };

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Shop not found</Text>
      </View>
    );
  }

  const avgRating = shop.reviews?.length
    ? (shop.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / shop.reviews.length).toFixed(1)
    : null;

  const activeOffers = shop.offers?.filter((o: any) =>
    new Date(o.validUntil) > new Date() && o.isActive
  ) || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Image Placeholder */}
        <View style={styles.headerImage}>
          <Ionicons name="storefront" size={64} color={colors.white} />
        </View>

        {/* Shop Info */}
        <View style={styles.shopInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
            )}
          </View>
          <Text style={styles.category}>{shop.category}</Text>

          {avgRating && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={colors.success[600]} />
                <Text style={styles.ratingText}>{avgRating}</Text>
              </View>
              <Text style={styles.reviewCount}>({shop.reviews?.length} reviews)</Text>
            </View>
          )}

          {shop.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color={colors.neutral[500]} />
              <Text style={styles.addressText}>{shop.address}</Text>
            </View>
          )}

          {shop.description && (
            <Text style={styles.description}>{shop.description}</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {shop.phone && (
            <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success[50] }]}>
                <Ionicons name="call" size={20} color={colors.success[600]} />
              </View>
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.quickAction} onPress={handleContact}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="chatbubble" size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.quickActionText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.neutral[100] }]}>
              <Ionicons name="share-social" size={20} color={colors.neutral[600]} />
            </View>
            <Text style={styles.quickActionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Active Offers */}
        {activeOffers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Offers</Text>
            {activeOffers.map((offer: any) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>{offer.discountPercent}% OFF</Text>
                  </View>
                </View>
                {offer.description && (
                  <Text style={styles.offerDescription}>{offer.description}</Text>
                )}
                <Text style={styles.offerValidity}>
                  Valid until {new Date(offer.validUntil).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Business Hours */}
        {shop.timing && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={18} color={colors.neutral[600]} />
              <Text style={styles.sectionTitle}>Business Hours</Text>
            </View>
            {Object.entries(shop.timing).map(([day, hours]: [string, any]) => (
              <View key={day} style={styles.timingRow}>
                <Text style={styles.timingDay}>{day}</Text>
                <Text style={[styles.timingHours, hours === 'Closed' && styles.timingClosed]}>
                  {hours}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {avgRating && (
              <View style={styles.ratingSmall}>
                <Ionicons name="star" size={14} color={colors.warning[500]} />
                <Text style={styles.ratingSmallText}>{avgRating}</Text>
              </View>
            )}
          </View>

          {(!shop.reviews || shop.reviews.length === 0) ? (
            <Text style={styles.emptyText}>No reviews yet</Text>
          ) : (
            shop.reviews.slice(0, 3).map((review: any) => (
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
        {shop.phone && (
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color={colors.primary[600]} />
            <Text style={styles.callButtonText}>Call Now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleContact}
          disabled={isContacting}
        >
          <Ionicons name="chatbubble" size={20} color={colors.white} />
          <Text style={styles.messageButtonText}>
            {isContacting ? 'Starting...' : 'Message'}
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
  headerImage: {
    height: 160,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shopName: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  category: {
    fontSize: fontSizes.md,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.success[700],
  },
  reviewCount: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  addressText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    flex: 1,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.neutral[600],
    lineHeight: 24,
    marginTop: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: fontSizes.xs,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionHeaderRow: {
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
  offerCard: {
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginBottom: spacing.sm,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  offerTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[900],
  },
  offerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.sm,
  },
  offerBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.white,
  },
  offerDescription: {
    fontSize: fontSizes.sm,
    color: colors.primary[700],
  },
  offerValidity: {
    fontSize: fontSizes.xs,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  timingDay: {
    fontSize: fontSizes.md,
    color: colors.neutral[600],
    textTransform: 'capitalize',
  },
  timingHours: {
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  timingClosed: {
    color: colors.error[500],
  },
  ratingSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingSmallText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[700],
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
  callButton: {
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
  callButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[600],
  },
  messageButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  messageButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
});
