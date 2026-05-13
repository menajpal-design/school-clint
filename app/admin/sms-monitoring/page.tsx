'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/api';
import { AlertCircle, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

interface SmsLog {
  _id: string;
  phoneNumber: string;
  recipientName: string;
  message: string;
  type: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered';
  sentAt: string;
  failureReason?: string;
}

interface Stats {
  totalSent: number;
  statusBreakdown: Array<{ _id: string; count: number }>;
  typeBreakdown: Array<{ _id: string; count: number }>;
}

export default function SmsMonitoringPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, []);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !token) return;

    const fetchSmsLogs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (typeFilter) params.append('type', typeFilter);

        const response = await fetch(
          `${API_URL}/sms-monitoring?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch SMS logs');
        const data = await response.json();
        setSmsLogs(data.data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/sms-monitoring/stats?days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchSmsLogs();
    fetchStats();
  }, [user, token, statusFilter, typeFilter]);

  const filteredLogs = smsLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.recipientName.toLowerCase().includes(searchLower) ||
      log.phoneNumber.includes(searchTerm) ||
      log.message.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-purple-100 text-purple-800';
      case 'fee':
        return 'bg-orange-100 text-orange-800';
      case 'notice':
        return 'bg-indigo-100 text-indigo-800';
      case 'notification':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div className="p-6 text-center text-red-600">Please log in to access SMS Monitoring</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              SMS Monitoring
            </h1>
          </div>
          <p className="text-slate-600">Track SMS delivery status to parents and guardians</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="text-sm text-slate-600 font-medium">Total Sent</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{stats.totalSent}</div>
            </div>

            {stats.statusBreakdown.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="text-sm text-slate-600 font-medium capitalize">{item._id}</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">{item.count}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Parent name, phone, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="attendance">Attendance</option>
                <option value="fee">Fee</option>
                <option value="notice">Notice</option>
                <option value="notification">Notification</option>
              </select>
            </div>
          </div>
        </div>

        {/* SMS Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading SMS logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No SMS records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Recipient</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Message</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-900">{log.recipientName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{log.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        <span title={log.message}>{log.message}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBgColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination info */}
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredLogs.length} of {smsLogs.length} SMS records
        </div>
      </div>
    </div>
  );
}


