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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-neutral-100">
        {data.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="w-16 h-16 text-neutral-300 mb-4" />
            <h2 className="text-lg font-medium text-neutral-900 mb-2">No messages yet</h2>
            <p className="text-neutral-500 max-w-xs">
              Start a conversation with a neighbor, helper, or shop owner.
            </p>
          </div>
        )}

        {data.data?.map((chat: any) => (
          <ChatItem key={chat.id} chat={chat} currentUserId={user?.id} />
        ))}
      </div>
    </div>
  );
}

function ChatItem({ chat, currentUserId }: { chat: any; currentUserId?: string }) {
  const otherUser = chat.otherParticipant || chat.participants?.find(
    (p: any) => p.userId !== currentUserId
  )?.user;

  const lastMessage = chat.messages?.[0];
  const isUnread = chat.unreadCount > 0;

  return (
    <Link
      href={`/inbox/${chat.id}`}
      className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors"
    >
      <div className="relative">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
          {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        {isUnread && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {chat.unreadCount}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-medium truncate ${isUnread ? 'text-neutral-900' : 'text-neutral-700'}`}>
            {otherUser?.name || 'Unknown'}
          </h3>
          {lastMessage && (
            <span className="text-xs text-neutral-500 flex-shrink-0">
              {formatTimeAgo(new Date(lastMessage.createdAt))}
            </span>
          )}
        </div>

        {lastMessage && (
          <div className="flex items-center gap-2">
            {lastMessage.senderId === currentUserId && (
              <span className="flex-shrink-0">
                {lastMessage.status === 'read' ? (
                  <CheckCheck className="w-4 h-4 text-primary-500" />
                ) : (
                  <Check className="w-4 h-4 text-neutral-400" />
                )}
              </span>
            )}
            <p className={`text-sm truncate ${isUnread ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>
              {lastMessage.content}
            </p>
          </div>
        )}

        {chat.task && (
          <span className="badge badge-primary text-xs mt-1">
            {chat.task.status}
          </span>
        )}
      </div>
    </Link>
  );
}
