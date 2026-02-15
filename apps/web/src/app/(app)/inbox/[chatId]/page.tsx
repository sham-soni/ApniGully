'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo } from '@apnigully/shared';
import { ArrowLeft, Send, Phone, MoreVertical, Check, CheckCheck, Image, Paperclip } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatId = params.chatId as string;
  const { data, mutate } = useSWR(`/chats/${chatId}`, fetcher) as { data: { data: any } | undefined; mutate: any };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.data?.messages]);

  // WebSocket connection
  useEffect(() => {
    if (!token || !chatId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const newSocket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.emit('join_chat', chatId);

    newSocket.on('new_message', (newMsg: any) => {
      if (newMsg.chatId === chatId) {
        mutate();
        // Mark as read
        newSocket.emit('mark_read', { chatId });
      }
    });

    newSocket.on('typing', (data: { userId: string; chatId: string }) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on('message_read', () => {
      mutate();
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_chat', chatId);
      newSocket.disconnect();
    };
  }, [token, chatId, user?.id, mutate]);

  // Mark messages as read on load
  useEffect(() => {
    if (socket && chatId) {
      socket.emit('mark_read', { chatId });
    }
  }, [socket, chatId, data]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const content = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      await api.post(`/chats/${chatId}/messages`, { content });
      mutate();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(content); // Restore message on error
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { chatId });
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col h-screen bg-[var(--bg-secondary)]">
        {/* Shimmer Header */}
        <div className="glass px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            <div className="h-3 w-16 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
          </div>
        </div>
        {/* Shimmer Messages */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start"><div className="h-12 w-48 rounded-3xl rounded-bl-lg bg-[var(--bg-tertiary)] animate-pulse" /></div>
          <div className="flex justify-end"><div className="h-12 w-56 rounded-3xl rounded-br-lg bg-[var(--bg-tertiary)] animate-pulse" /></div>
          <div className="flex justify-start"><div className="h-12 w-40 rounded-3xl rounded-bl-lg bg-[var(--bg-tertiary)] animate-pulse" /></div>
          <div className="flex justify-end"><div className="h-16 w-52 rounded-3xl rounded-br-lg bg-[var(--bg-tertiary)] animate-pulse" /></div>
        </div>
      </div>
    );
  }

  const chat = data.data;
  const otherUser = chat.otherParticipant || chat.participants?.find(
    (p: any) => p.userId !== user?.id
  )?.user;
  const messages = chat.messages || [];

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="glass px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        <div className="avatar-ring">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'var(--gradient-button)' }}>
            {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[var(--text-primary)] truncate">
            {otherUser?.name || 'Unknown'}
          </h1>
          {isTyping ? (
            <p className="text-xs font-medium text-primary-500">typing...</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              {otherUser?.isOnline ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-500 inline-block" />
                  Online
                </span>
              ) : 'Offline'}
            </p>
          )}
        </div>

        <button className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale-sm">
          <Phone className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <button className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale-sm">
          <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Task/Context Banner */}
      {chat.task && (
        <div className="mx-4 mt-2">
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <p className="text-sm text-[var(--text-secondary)] flex-1">
              <span className="font-semibold text-[var(--text-primary)]">Task:</span> {chat.task.title}
            </p>
            <span className="badge text-xs">{chat.task.status}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="card p-6 inline-block">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gradient-button)', opacity: 0.15 }}>
                <Send className="w-7 h-7 text-primary-500" />
              </div>
              <p className="text-[var(--text-muted)]">No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}

        {messages.map((msg: any, index: number) => {
          const isOwn = msg.senderId === user?.id;
          const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== msg.senderId);
          const showTime = index === messages.length - 1 ||
            messages[index + 1]?.senderId !== msg.senderId ||
            new Date(messages[index + 1]?.createdAt).getTime() - new Date(msg.createdAt).getTime() > 60000;

          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && showAvatar && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{ background: 'var(--gradient-button)' }}>
                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {!isOwn && !showAvatar && <div className="w-8" />}

                <div>
                  <div
                    className={`px-4 py-2.5 ${
                      isOwn
                        ? 'rounded-3xl rounded-br-lg text-white shadow-card'
                        : 'rounded-3xl rounded-bl-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-card'
                    }`}
                    style={isOwn ? { background: 'var(--gradient-sent)' } : undefined}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>

                  {showTime && (
                    <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatTimeAgo(new Date(msg.createdAt))}
                      </span>
                      {isOwn && (
                        msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-primary-500" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: 'var(--gradient-button)' }}>
              {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-3xl rounded-bl-lg px-5 py-3 shadow-card">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass p-4">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale-sm">
            <Paperclip className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <button className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale-sm">
            <Image className="w-5 h-5 text-[var(--text-muted)]" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color-light)] rounded-2xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          />

          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed press-scale transition-all"
            style={{ background: 'var(--gradient-button)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
