import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TABS = ['helpers', 'shops', 'rentals'] as const;

interface Helper {
  id: string;
  category: string;
  bio?: string;
  isVerified: boolean;
  user: { name: string };
  _count: { reviews: number };
}

interface Shop {
  id: string;
  name: string;
  category: string;
  isVerified: boolean;
  _count: { reviews: number };
}

interface Rental {
  id: string;
  title: string;
  rentAmount: number;
  bhkType?: string;
  furnishing?: string;
}

export function DiscoverScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('helpers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'rentals' ? 'rentals' : activeTab;
      const searchParam = searchQuery ? `?search=${searchQuery}` : '';
      const response = await api.get(`/${endpoint}${searchParam}`);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHelper = ({ item }: { item: Helper }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('HelperProfile', { id: item.id })}
    >
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>
          {item.user.name?.charAt(0).toUpperCase() || 'H'}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.user.name}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
          )}
        </View>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="star" size={14} color={colors.warning[500]} />
          <Text style={styles.cardMetaText}>{item._count.reviews} reviews</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
    </TouchableOpacity>
  );

  const renderShop = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ShopDetail', { id: item.id })}
    >
      <View style={[styles.cardAvatar, { backgroundColor: colors.success[50] }]}>
        <Ionicons name="storefront" size={24} color={colors.success[500]} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
          )}
        </View>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="star" size={14} color={colors.warning[500]} />
          <Text style={styles.cardMetaText}>{item._count.reviews} reviews</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
    </TouchableOpacity>
  );

  const renderRental = ({ item }: { item: Rental }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PostDetail', { id: item.id })}
    >
      <View style={[styles.cardAvatar, { backgroundColor: colors.primary[50] }]}>
        <Ionicons name="home" size={24} color={colors.primary[500]} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.rentalDetails}>
          {item.bhkType && (
            <View style={styles.rentalTag}>
              <Text style={styles.rentalTagText}>{item.bhkType}</Text>
            </View>
          )}
          {item.furnishing && (
            <View style={styles.rentalTag}>
              <Text style={styles.rentalTagText}>{item.furnishing}</Text>
            </View>
          )}
        </View>
        <Text style={styles.rentalPrice}>
          ₹{item.rentAmount?.toLocaleString()}/mo
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchTextInput}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={
            activeTab === 'helpers'
              ? renderHelper
              : activeTab === 'shops'
              ? renderShop
              : renderRental
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name={
                  activeTab === 'helpers'
                    ? 'people-outline'
                    : activeTab === 'shops'
                    ? 'storefront-outline'
                    : 'home-outline'
                }
                size={48}
                color={colors.neutral[300]}
              />
              <Text style={styles.emptyTitle}>No {activeTab} found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search'
                  : `Be the first to add ${activeTab} in your area`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primary[700],
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  cardCategory: {
    fontSize: fontSizes.sm,
    color: colors.primary[600],
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cardMetaText: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
  },
  rentalDetails: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  rentalTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
  },
  rentalTagText: {
    fontSize: fontSizes.xs,
    color: colors.primary[700],
    fontWeight: '500',
  },
  rentalPrice: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.neutral[700],
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
