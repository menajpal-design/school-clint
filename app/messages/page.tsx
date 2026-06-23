"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { normalizeUserRole } from '@/lib/permissions';

interface Message {
  _id: string;
  fromUserName: string;
  fromUserEmail: string;
  fromUserRole?: string;
  fromUser?: { role?: string };
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function InboxPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedRole, setSelectedRole] = useState<'all' | 'head' | 'teacher' | 'parent' | 'staff'>('all');

  const normalizedRole = normalizeUserRole(user?.role);
  const canSendSms = ['head', 'assistant_head', 'admin', 'super_admin'].includes(normalizedRole || '');

  // Custom SMS State
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsName, setSmsName] = useState('');
  const [smsType, setSmsType] = useState<'guardian' | 'teacher' | 'staff' | 'other'>('guardian');
  const [smsSending, setSmsSending] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [smsSuccess, setSmsSuccess] = useState('');

  const handleSendCustomSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsError('');
    setSmsSuccess('');

    const phoneDigits = smsPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      setSmsError(language === 'bn' ? 'সঠিক মোবাইল নাম্বার প্রদান করুন' : 'Please enter a valid mobile number');
      return;
    }
    if (!smsMessage.trim()) {
      setSmsError(language === 'bn' ? 'এসএমএস বার্তা লিখুন' : 'Please enter the message body');
      return;
    }

    try {
      setSmsSending(true);
      await api.messages.sendCustomSms({
        phone: phoneDigits,
        message: smsMessage,
        recipientName: smsName || undefined,
        recipientType: smsType,
      });
      setSmsSuccess(language === 'bn' ? 'এসএমএস সফলভাবে পাঠানো হয়েছে!' : 'SMS sent successfully!');
      setSmsPhone('');
      setSmsMessage('');
      setSmsName('');
      setTimeout(() => {
        setShowSmsModal(false);
        setSmsSuccess('');
        setSmsError('');
      }, 2000);
    } catch (err: any) {
      console.error('Custom SMS error:', err);
      setSmsError(err?.message || (language === 'bn' ? 'এসএমএস পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send SMS'));
    } finally {
      setSmsSending(false);
    }
  };

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

  const getRole = (message: Message) => {
    const role = (message as any).fromUserRole || message.fromUser?.role || (message as any).role;
    if (role) return String(role).toLowerCase();
    // fallback heuristics
    const email = message.fromUserEmail || '';
    if (email.includes('parent')) return 'parent';
    if (email.includes('teacher') || email.includes('tchr')) return 'teacher';
    if (email.includes('head') || email.includes('principal') || email.includes('admin')) return 'head';
    return 'staff';
  };

  const roleLabel = (r: string) => {
    if (r === 'head') return 'Head';
    if (r === 'teacher') return 'Teacher';
    if (r === 'parent') return 'Parent';
    return 'Staff';
  };

  const roleBadgeClass = (r: string) => {
    switch (r) {
      case 'head': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'teacher': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'parent': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      default: return 'bg-sky-100 text-sky-800 border border-sky-200';
    }
  };

  const filteredMessages = useMemo(() => messages.filter((m) => {
    if (selectedRole === 'all') return true;
    return getRole(m) === selectedRole;
  }), [messages, selectedRole]);

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
    return new Date(dateString).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
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
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">বার্তা</h1>
            {selectedTab === 'inbox' && unreadCount > 0 && (
              <p className="text-sm text-red-600">
                {unreadCount} টি অপড়া বার্তা
              </p>
            )}
          </div>
          {canSendSms && (
            <button
              onClick={() => setShowSmsModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition text-sm md:text-base"
            >
              {language === 'bn' ? 'কাস্টম এসএমএস পাঠান' : 'Send Custom SMS'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedTab('inbox')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedTab === 'inbox'
                ? 'bg-blue-600 text-white'
                : 'bg-card text-foreground border border-border hover:bg-popover'
            }`}
          >
            Inbox ({messages.length})
          </button>
          <button
            onClick={() => setSelectedTab('sent')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedTab === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-card text-foreground border border-border hover:bg-popover'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Role Filters */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'head', label: 'Head' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'parent', label: 'Parent' },
            { key: 'staff', label: 'Staff' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedRole(item.key as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${selectedRole === item.key ? 'bg-primary text-white' : 'bg-card border border-border hover:bg-popover'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Message List */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {selectedTab === 'inbox' ? 'কোনো বার্তা নেই' : 'কোনো পাঠানো বার্তা নেই'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map((message) => {
                const role = getRole(message);
                return (
                  <div
                    key={message._id}
                    className={`p-4 transition cursor-pointer ${!message.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{message.subject}</h3>
                          <span className={`inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded ${roleBadgeClass(role)}`}>{roleLabel(role)}</span>
                          {!message.isRead && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {selectedTab === 'inbox' ? `থেকে: ${message.fromUserName}` : `প্রাপক: ${message.fromUserName}`}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{message.body}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(message.createdAt)}</span>
                        <div className="flex gap-1">
                          {selectedTab === 'inbox' && !message.isRead && (
                            <button onClick={() => handleMarkAsRead(message._id)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="পড়া চিহ্নিত করুন">✓</button>
                          )}
                          <button onClick={() => handleDelete(message._id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="মুছুন">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-150 text-foreground">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {language === 'bn' ? 'কাস্টম এসএমএস পাঠান' : 'Send Custom SMS'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowSmsModal(false);
                  setSmsError('');
                  setSmsSuccess('');
                }}
                className="text-2xl font-light hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendCustomSms} className="p-5 space-y-4">
              {smsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {smsError}
                </div>
              )}
              {smsSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {smsSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'মোবাইল নাম্বার *' : 'Mobile Number *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01700000000"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  disabled={smsSending}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'প্রাপকের নাম' : 'Recipient Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
                  value={smsName}
                  onChange={(e) => setSmsName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  disabled={smsSending}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'প্রাপকের ধরণ' : 'Recipient Type'}
                </label>
                <select
                  value={smsType}
                  onChange={(e) => setSmsType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                  disabled={smsSending}
                >
                  <option value="guardian">{language === 'bn' ? 'অভিভাবক (Guardian)' : 'Guardian'}</option>
                  <option value="teacher">{language === 'bn' ? 'শিক্ষক (Teacher)' : 'Teacher'}</option>
                  <option value="staff">{language === 'bn' ? 'কর্মচারী (Staff)' : 'Staff'}</option>
                  <option value="other">{language === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'বার্তা *' : 'Message *'}
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={160}
                  placeholder={language === 'bn' ? 'আপনার বার্তাটি লিখুন (সর্বোচ্চ ১৬০ টি অক্ষর)...' : 'Type your message (Max 160 characters)...'}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  disabled={smsSending}
                />
                <div className="text-right text-[10px] text-gray-400 mt-1">
                  {smsMessage.length}/160
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                  disabled={smsSending}
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition disabled:bg-gray-400"
                  disabled={smsSending}
                >
                  {smsSending ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (language === 'bn' ? 'এসএমএস পাঠান' : 'Send SMS')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
