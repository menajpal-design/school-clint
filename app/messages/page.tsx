'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Message {
  _id: string;
  fromUserName: string;
  fromUserEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    fetchMessages();
  }, [selectedTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response: any = await (selectedTab === 'inbox'
        ? api.messages.getInbox()
        : api.messages.getSent());

      setMessages(response.data || []);
      if (selectedTab === 'inbox') {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
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

  const handleDelete = async (messageId: string) => {
    try {
      await api.messages.delete(messageId);
      setMessages(messages.filter(m => m._id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="p-4 text-center">লোড হচ্ছে...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">বার্তা</h1>
          {selectedTab === 'inbox' && unreadCount > 0 && (
            <p className="text-sm text-red-600">
              {unreadCount} টি অপড়া বার্তা
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedTab('inbox')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedTab === 'inbox'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            ইনবক্স ({messages.length})
          </button>
          <button
            onClick={() => setSelectedTab('sent')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedTab === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            পাঠানো
          </button>
        </div>

        {/* Message List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {selectedTab === 'inbox' ? 'কোনো বার্তা নেই' : 'কোনো পাঠানো বার্তা নেই'}
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                    !message.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {message.subject}
                        </h3>
                        {!message.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {selectedTab === 'inbox' 
                          ? `থেকে: ${message.fromUserName}`
                          : `প্রাপক: ${message.fromUserName}`
                        }
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {message.body}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(message.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        {selectedTab === 'inbox' && !message.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(message._id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title="পড়া চিহ্নিত করুন"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(message._id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="মুছুন"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
