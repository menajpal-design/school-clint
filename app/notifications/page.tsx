'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PieChartCard } from '@/components/charts/PieChartCard';

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

  const readUnread = [{ name: 'Unread', value: messages.filter(m => !m.isRead).length }, { name: 'Read', value: messages.filter(m => m.isRead).length }];

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
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="rounded-full border border-border bg-card px-4 py-2 text-muted-foreground shadow-sm">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Header */}
        <div className="page-gradient-card mb-6 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">বিজ্ঞপ্তি কেন্দ্র</h1>
              <p className="mt-2 text-muted-foreground">সকল আপনার বার্তা এবং বিজ্ঞপ্তি একসাথে দেখুন</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 hidden lg:block">
            <div className="rounded-2xl border border-border bg-card p-4">
              <PieChartCard title="Messages" data={readUnread} />
            </div>
          </div>
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-slate-900/5">
              {/* Filter Tabs */}
              <div className="flex border-b border-border bg-muted/40">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-3 text-center font-semibold transition ${
                    filter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  সব ({messages.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-4 py-3 text-center font-semibold transition ${
                    filter === 'unread'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  অপড়া ({messages.filter(m => !m.isRead).length})
                </button>
              </div>

              {/* Messages List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto divide-y">
                {filteredMessages.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {filter === 'unread' ? 'কোনো অপড়া বার্তা নেই' : 'কোনো বার্তা নেই'}
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <button
                      key={message._id}
                      onClick={() => setSelectedMessage(message)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        selectedMessage?._id === message._id
                          ? 'bg-primary/5 border-l-4 border-primary'
                          : ''
                      } ${
                        !message.isRead ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate text-sm font-semibold text-foreground">
                            {message.subject}
                          </h4>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {message.fromUserName}
                          </p>
                        </div>
                        {!message.isRead && (
                          <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary"></span>
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
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-slate-900/5">
                {/* Detail Header */}
                <div className="bg-gradient-to-r from-primary via-accent to-emerald-500 p-6 text-primary-foreground flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
                    <p className="mt-2 text-primary-foreground/80">
                      থেকে: {selectedMessage.fromUserName} ({selectedMessage.fromUserEmail})
                    </p>
                    <p className="mt-1 text-sm text-primary-foreground/80">
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
                    <span className="inline-block rounded-full bg-amber-300 px-3 py-1 text-sm font-semibold text-amber-950">
                      অপড়া
                    </span>
                  )}
                </div>

                {/* Message Body */}
                <div className="p-6">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                    {selectedMessage.body}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-border p-6">
                  {!selectedMessage.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(selectedMessage._id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" /> পড়া চিহ্নিত করুন
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" /> মুছুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-2xl border border-border bg-card p-12 shadow-lg shadow-slate-900/5">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30"
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
                  <p className="text-lg text-muted-foreground">একটি বার্তা নির্বাচন করুন</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
