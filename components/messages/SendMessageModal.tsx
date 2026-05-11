'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  onSuccess?: () => void;
}

export default function SendMessageModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientEmail,
  onSuccess,
}: SendMessageModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendAsEmail, setSendAsEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !body.trim()) {
      setError('বিষয় এবং বার্তা প্রয়োজন');
      return;
    }

    if (!recipientId || !recipientEmail) {
      setError('প্রাপক তথ্য অনুপলব্ধ');
      return;
    }

    try {
      setLoading(true);
      await api.messages.send({
        toUserId: recipientId,
        toUserEmail: recipientEmail,
        toUserName: recipientName || 'Recipient',
        subject,
        body,
        sendAsEmail,
      });

      setSubject('');
      setBody('');
      setSendAsEmail(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('Send message error:', err);
      setError('বার্তা পাঠাতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">নতুন বার্তা</h2>
          <button
            onClick={onClose}
            className="text-2xl font-light hover:bg-white hover:bg-opacity-20 w-8 h-8 rounded"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Recipient Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">প্রাপক</p>
            <p className="font-semibold text-gray-900">{recipientName}</p>
            <p className="text-sm text-gray-600">{recipientEmail}</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              বিষয় *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="বার্তার বিষয় লিখুন"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              বার্তা *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="আপনার বার্তা লিখুন..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Send as Email */}
          <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="sendAsEmail"
              checked={sendAsEmail}
              onChange={(e) => setSendAsEmail(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="sendAsEmail" className="flex-1 cursor-pointer text-sm text-gray-700">
              <span className="font-semibold">ইমেইলে পাঠান</span>
              <p className="text-xs text-gray-600">প্রাপকের ইমেইল ঠিকানায় এই বার্তা পাঠাবেন</p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'পাঠাচ্ছে...' : 'পাঠান'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
