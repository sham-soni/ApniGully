'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, apiClient } from '@/lib/api';
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
  const { data, mutate } = useSWR(`/chats/${chatId}`, fetcher);

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
      await apiClient.post(`/chats/${chatId}/messages`, { content });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chat = data.data;
  const otherUser = chat.otherParticipant || chat.participants?.find(
    (p: any) => p.userId !== user?.id
  )?.user;
  const messages = chat.messages || [];

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
          {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-medium text-neutral-900 truncate">
            {otherUser?.name || 'Unknown'}
          </h1>
          {isTyping ? (
            <p className="text-xs text-primary-500">typing...</p>
          ) : (
            <p className="text-xs text-neutral-500">
              {otherUser?.isOnline ? 'Online' : 'Offline'}
            </p>
          )}
        </div>

        <button className="p-2 hover:bg-neutral-100 rounded-full">
          <Phone className="w-5 h-5 text-neutral-600" />
        </button>
        <button className="p-2 hover:bg-neutral-100 rounded-full">
          <MoreVertical className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* Task/Context Banner */}
      {chat.task && (
        <div className="bg-primary-50 border-b border-primary-100 px-4 py-2">
          <p className="text-sm text-primary-700">
            <span className="font-medium">Task:</span> {chat.task.title}
            <span className="ml-2 badge badge-primary text-xs">{chat.task.status}</span>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>No messages yet. Start the conversation!</p>
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
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && showAvatar && (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-medium flex-shrink-0">
                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {!isOwn && !showAvatar && <div className="w-8" />}

                <div>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-white text-neutral-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>

                  {showTime && (
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-xs text-neutral-400">
                        {formatTimeAgo(new Date(msg.createdAt))}
                      </span>
                      {isOwn && (
                        msg.status === 'read' ? (
                          <CheckCheck className="w-3 h-3 text-primary-500" />
                        ) : (
                          <Check className="w-3 h-3 text-neutral-400" />
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
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-medium">
              {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-neutral-200 p-4">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-neutral-100 rounded-full">
            <Paperclip className="w-5 h-5 text-neutral-500" />
          </button>
          <button className="p-2 hover:bg-neutral-100 rounded-full">
            <Image className="w-5 h-5 text-neutral-500" />
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
            className="flex-1 input"
          />

          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
