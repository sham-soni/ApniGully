import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

interface BlockedUser {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    avatar?: string;
    phone: string;
  };
  createdAt: string;
}

export function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/users/me/blocked');
      setBlockedUsers(response.data.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblockingId(userId);
            try {
              await api.delete(`/users/${userId}/block`);
              setBlockedUsers(blockedUsers.filter(b => b.blockedUser.id !== userId));
              Alert.alert('Success', `${userName} has been unblocked`);
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        {item.blockedUser.avatar ? (
          <Image source={{ uri: item.blockedUser.avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {item.blockedUser.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.blockedUser.name}</Text>
        <Text style={styles.blockedDate}>
          Blocked on {formatDate(item.createdAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.blockedUser.id, item.blockedUser.name)}
        disabled={unblockingId === item.blockedUser.id}
      >
        {unblockingId === item.blockedUser.id ? (
          <ActivityIndicator size="small" color={colors.primary[600]} />
        ) : (
          <Text style={styles.unblockButtonText}>Unblock</Text>
        )}
      </TouchableOpacity>
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
    <View style={styles.container}>
      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={colors.neutral[600]} />
        <Text style={styles.infoText}>
          Blocked users cannot see your posts, send you messages, or view your profile.
        </Text>
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="ban" size={48} color={colors.neutral[300]} />
          </View>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptySubtitle}>
            When you block someone, they'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
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
    color: colors.neutral[500],
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  blockedDate: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
  },
  unblockButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
