import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type RentalDetailRouteProp = RouteProp<RootStackParamList, 'RentalDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface RentalListing {
  id: string;
  title: string;
  content: string;
  images: string[];
  parsedData?: {
    bhk?: string;
    rent?: number;
    deposit?: number;
    furnishing?: string;
    area?: number;
    floor?: string;
    amenities?: string[];
    locality?: string;
  };
  status: string;
  author: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
    isVerified: boolean;
    trustScore: number;
  };
  createdAt: string;
}

export function RentalDetailScreen() {
  const route = useRoute<RentalDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [rental, setRental] = useState<RentalListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { id } = route.params;

  useEffect(() => {
    fetchRental();
  }, [id]);

  const fetchRental = async () => {
    try {
      const response = await api.get(`/rentals/${id}`);
      setRental(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rental details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      const response = await api.post('/chats', {
        recipientId: rental?.author.id,
        type: 'direct',
      });
      navigation.navigate('Chat', {
        id: response.data.data.id,
        name: rental?.author.name,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const handleCall = () => {
    if (rental?.author.phone) {
      Linking.openURL(`tel:${rental.author.phone}`);
    } else {
      Alert.alert('Phone Not Available', 'The owner has not shared their phone number.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.loader}>
        <Ionicons name="home-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.errorText}>Rental not found</Text>
      </View>
    );
  }

  const { parsedData } = rental;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images Carousel */}
        {rental.images && rental.images.length > 0 ? (
          <View style={styles.imageCarousel}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImageIndex(index);
              }}
            >
              {rental.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {rental.images.length > 1 && (
              <View style={styles.imageDots}>
                {rental.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === activeImageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="home" size={48} color={colors.neutral[300]} />
            <Text style={styles.placeholderText}>No images available</Text>
          </View>
        )}

        {/* Price & Status */}
        <View style={styles.priceSection}>
          <View>
            <Text style={styles.price}>
              {parsedData?.rent
                ? `₹${parsedData.rent.toLocaleString()}/month`
                : 'Price on Request'}
            </Text>
            {parsedData?.deposit && (
              <Text style={styles.deposit}>
                Deposit: ₹{parsedData.deposit.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={[
            styles.statusBadge,
            rental.status === 'available' ? styles.statusAvailable : styles.statusRented,
          ]}>
            <Text style={styles.statusText}>
              {rental.status === 'available' ? 'Available' : 'Rented'}
            </Text>
          </View>
        </View>

        {/* Quick Info Grid */}
        <View style={styles.quickInfoGrid}>
          {parsedData?.bhk && (
            <View style={styles.quickInfoItem}>
              <Ionicons name="bed-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.quickInfoValue}>{parsedData.bhk}</Text>
              <Text style={styles.quickInfoLabel}>Type</Text>
            </View>
          )}
          {parsedData?.area && (
            <View style={styles.quickInfoItem}>
              <Ionicons name="resize-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.quickInfoValue}>{parsedData.area}</Text>
              <Text style={styles.quickInfoLabel}>Sq. Ft.</Text>
            </View>
          )}
          {parsedData?.furnishing && (
            <View style={styles.quickInfoItem}>
              <Ionicons name="cube-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.quickInfoValue}>{parsedData.furnishing}</Text>
              <Text style={styles.quickInfoLabel}>Furnishing</Text>
            </View>
          )}
          {parsedData?.floor && (
            <View style={styles.quickInfoItem}>
              <Ionicons name="layers-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.quickInfoValue}>{parsedData.floor}</Text>
              <Text style={styles.quickInfoLabel}>Floor</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{rental.content}</Text>
        </View>

        {/* Amenities */}
        {parsedData?.amenities && parsedData.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {parsedData.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityChip}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success[500]}
                  />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listed By</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              {rental.author.avatar ? (
                <Image source={{ uri: rental.author.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {rental.author.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerNameRow}>
                <Text style={styles.ownerName}>{rental.author.name}</Text>
                {rental.author.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
                )}
              </View>
              <Text style={styles.trustScore}>
                Trust Score: {rental.author.trustScore}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color={colors.primary[600]} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} onPress={handleContact}>
          <Ionicons name="chatbubble" size={20} color={colors.white} />
          <Text style={styles.chatButtonText}>Chat with Owner</Text>
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
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: colors.neutral[500],
  },
  imageCarousel: {
    height: 250,
    backgroundColor: colors.neutral[100],
  },
  carouselImage: {
    width,
    height: 250,
  },
  imageDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[400],
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  price: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.primary[600],
  },
  deposit: {
    fontSize: fontSizes.sm,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusAvailable: {
    backgroundColor: colors.success[100],
  },
  statusRented: {
    backgroundColor: colors.neutral[200],
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickInfoValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  quickInfoLabel: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.full,
  },
  amenityText: {
    fontSize: fontSizes.sm,
    color: colors.success[700],
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primary[700],
  },
  ownerInfo: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ownerName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  trustScore: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  bottomPadding: {
    height: 100,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  callButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[600],
  },
  chatButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  chatButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
});
