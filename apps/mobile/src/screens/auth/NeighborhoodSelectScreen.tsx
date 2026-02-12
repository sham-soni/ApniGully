import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NeighborhoodSelect'>;

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  isVerified: boolean;
  _count: {
    members: number;
  };
}

export function NeighborhoodSelectScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchNeighborhoods();
    } else {
      setNeighborhoods([]);
    }
  }, [searchQuery]);

  const searchNeighborhoods = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/neighborhoods?search=${searchQuery}`);
      setNeighborhoods(response.data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (inviteCode.length !== 8) {
      Alert.alert('Invalid Code', 'Please enter a valid 8-character invite code');
      return;
    }

    setIsJoining(true);
    try {
      await api.post('/neighborhoods/join', { inviteCode });
      Alert.alert('Success', 'You have joined the neighborhood!');
      navigation.navigate('MainTabs');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid invite code');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinNeighborhood = async (neighborhood: Neighborhood) => {
    Alert.alert(
      'Join Neighborhood',
      `Request to join "${neighborhood.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setIsJoining(true);
            try {
              await api.post(`/neighborhoods/${neighborhood.id}/join`);
              Alert.alert('Success', 'Join request sent! Waiting for approval.');
              navigation.navigate('MainTabs');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to join');
            } finally {
              setIsJoining(false);
            }
          },
        },
      ]
    );
  };

  const renderNeighborhood = ({ item }: { item: Neighborhood }) => (
    <TouchableOpacity
      style={styles.neighborhoodItem}
      onPress={() => handleJoinNeighborhood(item)}
    >
      <View style={styles.neighborhoodIcon}>
        <Ionicons name="location" size={24} color={colors.primary[500]} />
      </View>
      <View style={styles.neighborhoodInfo}>
        <View style={styles.neighborhoodHeader}>
          <Text style={styles.neighborhoodName}>{item.name}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
          )}
        </View>
        <Text style={styles.neighborhoodLocation}>
          {item.city}, {item.state} - {item.pincode}
        </Text>
        <Text style={styles.neighborhoodMembers}>
          {item._count.members} members
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Your Gully</Text>
          <Text style={styles.subtitle}>
            Find and join your neighborhood community
          </Text>
        </View>

        {/* Invite Code Section */}
        <View style={styles.inviteSection}>
          <Text style={styles.sectionLabel}>Have an invite code?</Text>
          <View style={styles.inviteRow}>
            <TextInput
              style={styles.inviteInput}
              placeholder="Enter 8-digit code"
              placeholderTextColor={colors.neutral[400]}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.joinButton, inviteCode.length !== 8 && styles.buttonDisabled]}
              onPress={handleJoinWithCode}
              disabled={inviteCode.length !== 8 || isJoining}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or search</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color={colors.neutral[400]} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search by name, area, or pincode"
              placeholderTextColor={colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Results */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary[500]} style={styles.loader} />
        ) : (
          <FlatList
            data={neighborhoods}
            keyExtractor={(item) => item.id}
            renderItem={renderNeighborhood}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery.length >= 2 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={48} color={colors.neutral[300]} />
                  <Text style={styles.emptyTitle}>No neighborhoods found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try a different search or create a new one
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="compass-outline" size={48} color={colors.neutral[300]} />
                  <Text style={styles.emptyTitle}>Search for your neighborhood</Text>
                  <Text style={styles.emptySubtitle}>
                    Enter at least 2 characters to search
                  </Text>
                </View>
              )
            }
          />
        )}

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.neutral[500],
  },
  inviteSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inviteInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: fontSizes.md,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.neutral[900],
  },
  joinButton: {
    height: 48,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  joinButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[400],
    paddingHorizontal: spacing.md,
  },
  searchSection: {
    marginBottom: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  neighborhoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  neighborhoodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  neighborhoodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  neighborhoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  neighborhoodName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  neighborhoodLocation: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  neighborhoodMembers: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
  loader: {
    marginTop: spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSizes.md,
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
  },
});
