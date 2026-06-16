'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/api';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Activity, 
  Settings, 
  Send, 
  Smartphone, 
  RefreshCw, 
  Building2,
  Sliders,
  Check
} from 'lucide-react';

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

  // Platform admin school selection
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Diagnostic state
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    smsEnabled: true,
    smsProvider: 'anoncify',
    smsApiUrl: 'https://anoncify.xyz/api/sms',
    smsApiKey: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ success: boolean; text: string } | null>(null);

  const isSystemAdmin = user && ['admin', 'super_admin'].includes(user.role);

  // Fetch institutions list for platform admins
  useEffect(() => {
    if (!token || !user) return;
    if (isSystemAdmin) {
      fetch(`${API_URL}/admin/schools`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setSchools(data.schools || []);
      })
      .catch(err => console.error('Error fetching schools:', err));
    }
  }, [user, token, isSystemAdmin]);

  // Load configuration settings
  const fetchSettings = async () => {
    if (!token) return;
    try {
      setSettingsLoading(true);
      const params = new URLSearchParams();
      if (selectedSchoolId) params.append('institutionId', selectedSchoolId);
      const res = await fetch(`${API_URL}/sms-monitoring/sms-settings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsForm({
          smsEnabled: data.smsEnabled ?? true,
          smsProvider: data.smsProvider || 'anoncify',
          smsApiUrl: data.smsApiUrl || 'https://anoncify.xyz/api/sms',
          smsApiKey: '' // Leave blank to avoid accidental overwrite
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Run SMS Diagnostic
  const fetchDiagnosis = async () => {
    if (!token) return;
    try {
      setDiagnosticLoading(true);
      const params = new URLSearchParams();
      if (selectedSchoolId) params.append('institutionId', selectedSchoolId);
      const res = await fetch(`${API_URL}/sms-monitoring/sms-diagnostic?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data.diagnosis || null);
      }
    } catch (err) {
      console.error('Failed to run diagnostic:', err);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // Main statistics and logs loading
  const fetchSmsLogsAndStats = async () => {
    if (!user || !token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (selectedSchoolId) params.append('institutionId', selectedSchoolId);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/sms-monitoring?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/sms-monitoring/stats?days=30${selectedSchoolId ? `&institutionId=${selectedSchoolId}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setSmsLogs(logsData.data || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching logs and stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsLogsAndStats();
    fetchSettings();
    fetchDiagnosis();
  }, [user, token, statusFilter, typeFilter, selectedSchoolId]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSavingSettings(true);
      setSettingsMessage(null);
      
      const payload: any = {
        smsEnabled: settingsForm.smsEnabled,
        smsProvider: settingsForm.smsProvider,
        smsApiUrl: settingsForm.smsApiUrl
      };
      if (selectedSchoolId) payload.institutionId = selectedSchoolId;
      if (settingsForm.smsApiKey) payload.smsApiKey = settingsForm.smsApiKey;

      const res = await fetch(`${API_URL}/sms-monitoring/sms-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMessage({ success: true, text: data.message || 'SMS Settings saved successfully!' });
        setSettingsForm(prev => ({ ...prev, smsApiKey: '' }));
        fetchSettings();
        fetchDiagnosis();
      } else {
        setSettingsMessage({ success: false, text: data.message || 'Failed to save settings.' });
      }
    } catch (err: any) {
      setSettingsMessage({ success: false, text: err.message || 'Error occurred.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const sendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !testPhone) return;
    try {
      setTestSending(true);
      setTestResult(null);
      
      const payload: any = { phone: testPhone };
      if (selectedSchoolId) payload.institutionId = selectedSchoolId;

      const res = await fetch(`${API_URL}/sms-monitoring/sms-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        setTestResult({ success: true, message: `Test SMS dispatched successfully to ${testPhone}!` });
        setTestPhone('');
        setTimeout(() => setTestResult(null), 5000);
        fetchSmsLogsAndStats(); // refresh logs
      } else {
        setTestResult({ success: false, message: `Failed to send SMS to ${testPhone}. Check API Key/Balance.` });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to send test SMS.' });
    } finally {
      setTestSending(false);
    }
  };

  const filteredLogs = smsLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.recipientName || '').toLowerCase().includes(searchLower) ||
      (log.phoneNumber || '').includes(searchTerm) ||
      (log.message || '').toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'delivered':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'fee':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'notice':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'notification':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">Please log in as an administrator or school leader to monitor SMS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SMS Control & Monitoring</h1>
              <p className="text-sm text-slate-500">Manage API keys, diagnose gateway issues, and track school notification delivery.</p>
            </div>
          </div>

          {/* School Selector (Platform Admin Only) */}
          {isSystemAdmin && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-w-[240px]">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">System Default Context</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Diagnostic & Quick-Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Diagnostic Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gateway Diagnostic</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  {diagnostic?.institutionName || 'System Default'}
                </h3>
              </div>
              <button 
                onClick={fetchDiagnosis}
                disabled={diagnosticLoading}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                title="Rerun diagnostics"
              >
                <RefreshCw className={`w-4 h-4 ${diagnosticLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {diagnostic ? (
              <div className="space-y-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold ${diagnostic.smsEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diagnostic.smsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Provider</span>
                  <span className="font-semibold text-slate-800 capitalize">{diagnostic.provider}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">SMS Balance</span>
                  <span className="font-bold text-blue-600">{diagnostic.smsBalance} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">API Key Status</span>
                  <span className={`font-semibold ${diagnostic.hasValidKey ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diagnostic.hasValidKey ? 'Valid' : 'Invalid/Missing'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center">Loading diagnostic info...</div>
            )}

            <div className="border-t border-slate-100 pt-3">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${diagnostic?.hasValidKey ? 'text-emerald-600' : 'text-rose-600'}`}>
                {diagnostic?.verdict || 'Running diagnostics...'}
              </span>
            </div>
          </div>

          {/* Test SMS Dispatcher */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Test Tool</span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">Send Test Message</h3>
              <p className="text-xs text-slate-500 mt-1">Submit a test message using the configured gateway details.</p>
            </div>

            <form onSubmit={sendTestSms} className="space-y-3">
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Receiver Phone (e.g. 01700000000)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={testSending || !testPhone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{testSending ? 'Dispatching...' : 'Dispatch Test SMS'}</span>
              </button>
            </form>
          </div>

          {/* Statistics Card */}
          {stats && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Activity Overview</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">Usage stats (Last 30 Days)</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Dispatched</span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{stats.totalSent}</div>
                </div>
                {(stats.statusBreakdown || []).slice(0, 3).map((item) => (
                  <div key={item._id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold capitalize">{item._id}</span>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Panel: Split Settings & Log Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Settings Config Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">Gateway Configurations</h3>
            </div>

            {settingsLoading ? (
              <div className="text-center text-sm text-slate-400 py-6">Loading settings...</div>
            ) : (
              <form onSubmit={saveSettings} className="space-y-4">
                
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">SMS Outgoing Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settingsForm.smsEnabled}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Provider API Name</label>
                  <select
                    value={settingsForm.smsProvider}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, smsProvider: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="anoncify">Anoncify (Standard)</option>
                    <option value="twilio">Twilio</option>
                    <option value="nexmo">Nexmo/Vonage</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Gateway API URL</label>
                  <input
                    type="url"
                    value={settingsForm.smsApiUrl}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, smsApiUrl: e.target.value }))}
                    placeholder="https://api-url-here"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Gateway Access Token / API Key</label>
                  <input
                    type="password"
                    value={settingsForm.smsApiKey}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, smsApiKey: e.target.value }))}
                    placeholder="••••••••••••••••"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to keep current server key.</span>
                </div>

                {settingsMessage && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                    settingsMessage.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {settingsMessage.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{settingsMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>{savingSettings ? 'Saving...' : 'Update Settings'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Logs Table and Filters Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">Delivery Registry</h3>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Search name, phone, message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="attendance">Attendance</option>
                  <option value="fee">Fee</option>
                  <option value="notice">Notice</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
            </div>

            {/* Logs list */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No logs match your filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {log.recipientName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {log.phoneNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-4 py-3 text-[10px] whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full font-semibold border ${getTypeColor(log.type)}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] whitespace-nowrap">
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(log.status)}
                              <span className={`px-2 py-0.5 rounded-full font-semibold border ${getStatusBgColor(log.status)}`}>
                                {log.status}
                              </span>
                            </div>
                            {log.status === 'failed' && log.failureReason && (
                              <span className="text-[9px] text-rose-500 max-w-[120px] truncate" title={log.failureReason}>
                                Reason: {log.failureReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs text-slate-400 flex justify-between items-center pt-2">
              <span>Showing {filteredLogs.length} of {smsLogs.length} entries</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
