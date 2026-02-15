'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher } from '@/lib/api';
import { formatTimeAgo } from '@apnigully/shared';
import { MessageCircle, Search, Check, CheckCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function InboxPage() {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  const { data, mutate } = useSWR('/chats', fetcher) as { data: { data: any[] } | undefined; mutate: any };

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const newSocket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('new_message', () => {
      mutate(); // Refresh chat list
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, mutate]);

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32 rounded-lg" />
              <div className="skeleton h-3 w-48 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="input pl-11 rounded-2xl"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="px-4 space-y-2 pb-6">
        {data.data?.length === 0 && (
          <div className="card p-16 text-center shadow-card">
            <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-4"
                 style={{ background: 'var(--gradient-hero-soft)' }}>
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">No messages yet</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
              Start a conversation with a neighbor, helper, or shop owner.
            </p>
          </div>
        )}

        {data.data?.map((chat: any, index: number) => (
          <ChatItem key={chat.id} chat={chat} currentUserId={user?.id} index={index} />
        ))}
      </div>
    </div>
  );
}

function ChatItem({ chat, currentUserId, index }: { chat: any; currentUserId?: string; index: number }) {
  const otherUser = chat.otherParticipant || chat.participants?.find(
    (p: any) => p.userId !== currentUserId
  )?.user;

  const lastMessage = chat.messages?.[0];
  const isUnread = chat.unreadCount > 0;

  return (
    <Link
      href={`/inbox/${chat.id}`}
      className={`card flex items-center gap-3.5 p-4 shadow-card transition-all duration-200 press-scale-sm animate-slide-up ${
        isUnread ? 'bg-gradient-card' : ''
      }`}
      style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold"
             style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))', color: 'var(--color-primary-700)' }}>
          {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        {isUnread && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
               style={{ background: 'var(--gradient-button)' }}>
            {chat.unreadCount}
          </div>
        )}
        {/* Online dot - can be driven by real data */}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-accent-500 border-2 border-[var(--bg-card)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold truncate text-sm ${isUnread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {otherUser?.name || 'Unknown'}
          </h3>
          {lastMessage && (
            <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0 ml-2">
              {formatTimeAgo(new Date(lastMessage.createdAt))}
            </span>
          )}
        </div>

        {lastMessage && (
          <div className="flex items-center gap-1.5">
            {lastMessage.senderId === currentUserId && (
              <span className="flex-shrink-0">
                {lastMessage.status === 'read' ? (
                  <CheckCheck className="w-4 h-4 text-primary-500" />
                ) : (
                  <Check className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </span>
            )}
            <p className={`text-sm truncate ${isUnread ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
              {lastMessage.content}
            </p>
          </div>
        )}

        {chat.task && (
          <span className="badge badge-primary text-[10px] mt-1.5">
            {chat.task.status}
          </span>
        )}
      </div>
    </Link>
  );
}
