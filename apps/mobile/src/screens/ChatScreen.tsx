import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatTimeAgo } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Message {
  id: string;
  content: string;
  senderId: string;
  status: string;
  createdAt: string;
}

interface Chat {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
  };
  messages: Message[];
  task?: {
    title: string;
    status: string;
  };
}

export function ChatScreen() {
  const route = useRoute<ChatRouteProp>();
  const { user, token } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { id: chatId } = route.params;

  useEffect(() => {
    fetchChat();
    setupSocket();

    return () => {
      socket?.disconnect();
    };
  }, [chatId]);

  const fetchChat = async () => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      setChat(response.data.data);
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocket = () => {
    const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'http://localhost:4000';
    const newSocket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.emit('join_chat', chatId);

    newSocket.on('new_message', (msg: Message) => {
      if (msg.senderId !== user?.id) {
        setChat((prev) => prev ? {
          ...prev,
          messages: [msg, ...prev.messages],
        } : null);
        newSocket.emit('mark_read', { chatId });
      }
    });

    newSocket.on('typing', ({ userId }: { userId: string }) => {
      if (userId !== user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on('message_read', () => {
      fetchChat();
    });

    setSocket(newSocket);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const content = message.trim();
    setMessage('');
    setIsSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user?.id || '',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    setChat((prev) => prev ? {
      ...prev,
      messages: [tempMessage, ...prev.messages],
    } : null);

    try {
      await api.post(`/chats/${chatId}/messages`, { content });
      fetchChat();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setChat((prev) => prev ? {
        ...prev,
        messages: prev.messages.filter((m) => m.id !== tempMessage.id),
      } : null);
      setMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    socket?.emit('typing', { chatId });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const messages = chat?.messages || [];
    const prevMessage = messages[index + 1];
    const showTime = !prevMessage ||
      prevMessage.senderId !== item.senderId ||
      new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 60000;

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
        </View>
        {showTime && (
          <View style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            <Text style={styles.messageTimeText}>
              {formatTimeAgo(new Date(item.createdAt))}
            </Text>
            {isOwn && (
              <Ionicons
                name={item.status === 'read' ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.status === 'read' ? colors.primary[500] : colors.neutral[400]}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Task Banner */}
      {chat?.task && (
        <View style={styles.taskBanner}>
          <Ionicons name="briefcase-outline" size={16} color={colors.primary[700]} />
          <Text style={styles.taskBannerText}>Task: {chat.task.title}</Text>
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>{chat.task.status}</Text>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chat?.messages || []}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { animationDelay: '0s' }]} />
                <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach" size={24} color={colors.neutral[500]} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.neutral[400]}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            handleTyping();
          }}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || isSending}
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? colors.white : colors.neutral[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  taskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
    gap: spacing.sm,
  },
  taskBannerText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.primary[700],
  },
  taskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.sm,
  },
  taskBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.white,
  },
  messagesList: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  messageRow: {
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: borderRadius.sm,
  },
  messageBubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: fontSizes.md,
    color: colors.neutral[900],
    lineHeight: 22,
  },
  messageTextOwn: {
    color: colors.white,
  },
  messageTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  messageTimeOwn: {
    justifyContent: 'flex-end',
  },
  messageTimeText: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[400],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: spacing.sm,
  },
  attachButton: {
    padding: spacing.xs,
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
