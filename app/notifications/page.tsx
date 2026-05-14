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

export default function NotificationsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response: any = await api.messages.getInbox();
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = filter === 'unread' 
    ? messages.filter(m => !m.isRead)
    : messages;

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await api.messages.markAsRead(messageId);
      setMessages(messages.map(m => 
        m._id === messageId ? { ...m, isRead: true } : m
      ));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage({ ...selectedMessage, isRead: true });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await api.messages.delete(messageId);
      setMessages(messages.filter(m => m._id !== messageId));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'গতকাল';
    } else {
      return date.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
          <h1 className="text-3xl font-bold text-gray-800">বিজ্ঞপ্তি কেন্দ্র</h1>
          <p className="text-gray-600 mt-2">সকল আপনার বার্তা এবং বিজ্ঞপ্তি একসাথে দেখুন</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              {/* Filter Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-3 text-center font-semibold transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  সব ({messages.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-4 py-3 text-center font-semibold transition ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  অপড়া ({messages.filter(m => !m.isRead).length})
                </button>
              </div>

              {/* Messages List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto divide-y">
                {filteredMessages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {filter === 'unread' ? 'কোনো অপড়া বার্তা নেই' : 'কোনো বার্তা নেই'}
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <button
                      key={message._id}
                      onClick={() => setSelectedMessage(message)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        selectedMessage?._id === message._id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : ''
                      } ${
                        !message.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate text-sm">
                            {message.subject}
                          </h4>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {message.fromUserName}
                          </p>
                        </div>
                        {!message.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
                {/* Detail Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
                    <p className="text-blue-100 mt-2">
                      থেকে: {selectedMessage.fromUserName} ({selectedMessage.fromUserEmail})
                    </p>
                    <p className="text-blue-100 text-sm mt-1">
                      {new Date(selectedMessage.createdAt).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!selectedMessage.isRead && (
                    <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-semibold">
                      অপড়া
                    </span>
                  )}
                </div>

                {/* Message Body */}
                <div className="p-6">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.body}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t p-6 flex gap-3 justify-end">
                  {!selectedMessage.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(selectedMessage._id)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition"
                    >
                      ✓ পড়া চিহ্নিত করুন
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold transition"
                  >
                    🗑️ মুছুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-md p-12 flex items-center justify-center h-96 border border-border">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12l2 2m0 0l4-4m-4 4l-4-4m4 4h7"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">একটি বার্তা নির্বাচন করুন</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
