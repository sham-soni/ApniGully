import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatTimeAgo, POST_TYPE_CONFIG } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius, shadows } from '@/theme';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

interface Post {
  id: string;
  type: string;
  title?: string;
  content: string;
  parsedData?: any;
  author: {
    id: string;
    name: string;
    isVerified: boolean;
  };
  neighborhood: { name: string };
  createdAt: string;
  reactions: Array<{ userId: string; type: string }>;
  comments: Array<{
    id: string;
    content: string;
    author: { name: string };
    createdAt: string;
  }>;
  _count: { reactions: number; comments: number };
}

export function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { id } = route.params;

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data.data);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async () => {
    if (!post) return;
    try {
      await api.post(`/posts/${id}/reactions`, { type: 'like' });
      fetchPost();
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${id}/comments`, { content: comment.trim() });
      setComment('');
      fetchPost();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const typeConfig = POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG];
  const hasLiked = post.reactions?.some((r) => r.userId === user?.id && r.type === 'like');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Author */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.author.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
              )}
            </View>
            <Text style={styles.postMeta}>
              {formatTimeAgo(new Date(post.createdAt))} · {post.neighborhood.name}
            </Text>
          </View>
        </View>

        {/* Type Badge */}
        {typeConfig && (
          <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}20` }]}>
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
        )}

        {/* Content */}
        {post.title && <Text style={styles.title}>{post.title}</Text>}
        <Text style={styles.content}>{post.content}</Text>

        {/* Parsed Data for Rentals */}
        {post.type === 'rental' && post.parsedData && (
          <View style={styles.parsedData}>
            <Text style={styles.parsedDataTitle}>Property Details</Text>
            <View style={styles.parsedDataGrid}>
              {post.parsedData.bhk && (
                <View style={styles.parsedDataItem}>
                  <Text style={styles.parsedDataLabel}>Type</Text>
                  <Text style={styles.parsedDataValue}>{post.parsedData.bhk}</Text>
                </View>
              )}
              {post.parsedData.rent && (
                <View style={styles.parsedDataItem}>
                  <Text style={styles.parsedDataLabel}>Rent</Text>
                  <Text style={styles.parsedDataValue}>₹{post.parsedData.rent.toLocaleString()}/mo</Text>
                </View>
              )}
              {post.parsedData.deposit && (
                <View style={styles.parsedDataItem}>
                  <Text style={styles.parsedDataLabel}>Deposit</Text>
                  <Text style={styles.parsedDataValue}>₹{post.parsedData.deposit.toLocaleString()}</Text>
                </View>
              )}
              {post.parsedData.furnishing && (
                <View style={styles.parsedDataItem}>
                  <Text style={styles.parsedDataLabel}>Furnishing</Text>
                  <Text style={styles.parsedDataValue}>{post.parsedData.furnishing}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleReaction}>
            <Ionicons
              name={hasLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={hasLiked ? colors.error[500] : colors.neutral[500]}
            />
            <Text style={styles.actionText}>{post._count.reactions}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.neutral[500]} />
            <Text style={styles.actionText}>{post._count.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={colors.neutral[500]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color={colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({post.comments?.length || 0})
          </Text>

          {(!post.comments || post.comments.length === 0) ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            post.comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {c.author.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.author.name}</Text>
                    <Text style={styles.commentTime}>
                      {formatTimeAgo(new Date(c.createdAt))}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={colors.neutral[400]}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !comment.trim() && styles.sendButtonDisabled]}
          onPress={handleComment}
          disabled={!comment.trim() || isSubmitting}
        >
          <Ionicons
            name="send"
            size={20}
            color={comment.trim() ? colors.white : colors.neutral[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
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
  authorInfo: {
    marginLeft: spacing.md,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  postMeta: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  typeBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  content: {
    fontSize: fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  parsedData: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  parsedDataTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  parsedDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  parsedDataItem: {
    width: '45%',
  },
  parsedDataLabel: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
  },
  parsedDataValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing['2xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: fontSizes.md,
    color: colors.neutral[500],
  },
  commentsSection: {
    marginTop: spacing.xl,
  },
  commentsTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  noComments: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary[700],
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  commentTime: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
  },
  commentText: {
    fontSize: fontSizes.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.xl,
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
});
