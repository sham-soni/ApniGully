import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { formatTimeAgo } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Chat {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
  };
  messages: Array<{
    id: string;
    content: string;
    senderId: string;
    status: string;
    createdAt: string;
  }>;
  unreadCount: number;
  task?: {
    title: string;
    status: string;
  };
}

export function InboxScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const lastMessage = item.messages?.[0];
    const isUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { id: item.id, name: item.otherParticipant?.name })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.otherParticipant?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, isUnread && styles.chatNameUnread]}>
              {item.otherParticipant?.name || 'Unknown'}
            </Text>
            {lastMessage && (
              <Text style={styles.chatTime}>
                {formatTimeAgo(new Date(lastMessage.createdAt))}
              </Text>
            )}
          </View>

          {lastMessage && (
            <View style={styles.messageRow}>
              {lastMessage.senderId === user?.id && (
                <Ionicons
                  name={lastMessage.status === 'read' ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={lastMessage.status === 'read' ? colors.primary[500] : colors.neutral[400]}
                />
              )}
              <Text
                style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                numberOfLines={1}
              >
                {lastMessage.content}
              </Text>
            </View>
          )}

          {item.task && (
            <View style={styles.taskBadge}>
              <Text style={styles.taskBadgeText}>{item.task.status}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with a neighbor, helper, or shop owner.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primary[700],
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.white,
  },
  chatContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  chatNameUnread: {
    fontWeight: '600',
    color: colors.neutral[900],
  },
  chatTime: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  lastMessage: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
  },
  lastMessageUnread: {
    fontWeight: '500',
    color: colors.neutral[900],
  },
  taskBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
  },
  taskBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.primary[700],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.neutral[900],
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
