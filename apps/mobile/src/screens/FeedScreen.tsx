import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatTimeAgo, POST_TYPE_CONFIG } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const POST_TYPES = ['all', 'update', 'alert', 'event', 'recommendation', 'question', 'rental', 'lost_found'];

interface Post {
  id: string;
  type: string;
  title?: string;
  content: string;
  author: {
    id: string;
    name: string;
    isVerified: boolean;
  };
  neighborhood: {
    name: string;
  };
  createdAt: string;
  _count: {
    reactions: number;
    comments: number;
  };
  hasLiked?: boolean;
}

export function FeedScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const typeParam = selectedType === 'all' ? '' : `&type=${selectedType}`;
      const response = await api.get(`/posts?limit=20${typeParam}`);
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedType]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleReaction = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/reactions`, { type: 'like' });
      // Optimistic update
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, hasLiked: !p.hasLiked, _count: { ...p._count, reactions: p._count.reactions + (p.hasLiked ? -1 : 1) } }
          : p
      ));
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  };

  const renderTypeFilter = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={POST_TYPES}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.filterList}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.filterChip, selectedType === item && styles.filterChipActive]}
          onPress={() => setSelectedType(item)}
        >
          <Text style={[styles.filterText, selectedType === item && styles.filterTextActive]}>
            {item === 'all' ? 'All' : POST_TYPE_CONFIG[item as keyof typeof POST_TYPE_CONFIG]?.label || item}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderPost = ({ item }: { item: Post }) => {
    const typeConfig = POST_TYPE_CONFIG[item.type as keyof typeof POST_TYPE_CONFIG];

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.author.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.postMeta}>
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{item.author.name}</Text>
              {item.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.primary[500]} />
              )}
            </View>
            <Text style={styles.postTime}>
              {formatTimeAgo(new Date(item.createdAt))} · {item.neighborhood.name}
            </Text>
          </View>
          {typeConfig && (
            <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}20` }]}>
              <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>
          )}
        </View>

        {item.title && (
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>
        )}
        <Text style={styles.postContent} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction(item.id)}
          >
            <Ionicons
              name={item.hasLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.hasLiked ? colors.error[500] : colors.neutral[500]}
            />
            <Text style={styles.actionText}>{item._count.reactions}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.neutral[500]} />
            <Text style={styles.actionText}>{item._count.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ApniGully</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('CreatePost', {})}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Type Filters */}
      {renderTypeFilter()}

      {/* Posts */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchPosts(true)}
              colors={[colors.primary[500]]}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share something with your neighbors!
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.primary[600],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.neutral[600],
  },
  filterTextActive: {
    color: colors.white,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postsList: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  postCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[700],
  },
  postMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  postTime: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  postContent: {
    fontSize: fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
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
