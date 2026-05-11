'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Message {
  _id: string;
  fromUserName: string;
  subject: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response: any = await api.messages.getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response: any = await api.messages.getInbox();
      setMessages(response.data?.slice(0, 5) || []); // Show only first 5
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      fetchMessages();
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.messages.markAsRead(messageId);
      setMessages(messages.map(m => 
        m._id === messageId ? { ...m, isRead: true } : m
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
        title="বার্তা"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-[400px] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center border-b">
            <h3 className="font-bold text-lg">বার্তা</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
            >
              ✕
            </button>
          </div>

          {/* Messages List */}
          {loading ? (
            <div className="p-4 text-center text-gray-500">লোড হচ্ছে...</div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              কোনো বার্তা নেই
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <Link
                  key={message._id}
                  href={`/messages?id=${message._id}`}
                  onClick={() => setIsOpen(false)}
                  className={`block p-4 hover:bg-gray-50 transition ${
                    !message.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate text-sm">
                          {message.subject}
                        </h4>
                        {!message.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        থেকে: {message.fromUserName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.createdAt).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    {!message.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, message._id)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex-shrink-0"
                        title="পড়া চিহ্নিত করুন"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer - View All Link */}
          <Link
            href="/messages"
            onClick={() => setIsOpen(false)}
            className="block p-3 text-center text-blue-600 hover:bg-gray-50 border-t font-semibold text-sm transition"
          >
            সব বার্তা দেখুন
          </Link>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
