'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/api';
import { User as UserIcon, Eye, Key, RefreshCw } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface Credentials {
  username: string;
  email: string;
  note: string;
}

export default function SubordinatesPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, []);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const fetchSubordinates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/users/subordinates/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch subordinates');
        const data = await response.json();
        setSubordinates(data.users || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubordinates();
  }, [user, token]);

  const handleViewCredentials = async (selectedUser: User) => {
    try {
      setSelectedUser(selectedUser);
      const response = await fetch(`${API_URL}/users/view-credentials/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch credentials');
      const data = await response.json();
      setCredentials(data.credentials);
      setShowCredentialModal(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      setResettingPasswordId(userId);
      const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: undefined }), // Will use default
      });

      if (!response.ok) throw new Error('Failed to reset password');
      const data = await response.json();
      setTempPassword(data.temporaryPassword);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to reset password');
    } finally {
      setResettingPasswordId(null);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'head': 'bg-red-100 text-red-800',
      'assistant_head': 'bg-orange-100 text-orange-800',
      'class_teacher': 'bg-blue-100 text-blue-800',
      'subject_teacher': 'bg-purple-100 text-purple-800',
      'teacher': 'bg-indigo-100 text-indigo-800',
      'finance_officer': 'bg-green-100 text-green-800',
      'staff': 'bg-slate-100 text-slate-800',
      'student': 'bg-cyan-100 text-cyan-800',
      'parent': 'bg-pink-100 text-pink-800',
      'committee_member': 'bg-amber-100 text-amber-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return <div className="p-6 text-center text-red-600">Please log in to access this page</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Manage Subordinates
            </h1>
          </div>
          <p className="text-slate-600">View and manage credentials for users under your supervision</p>
        </div>

        {/* Subordinates Grid/Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading subordinates...</div>
          ) : subordinates.length === 0 ? (
            <div className="p-8 text-center">
              <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No subordinates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subordinates.map((subordinate) => (
                    <tr key={subordinate._id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{subordinate.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{subordinate.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subordinate.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(subordinate.role)}`}>
                          {subordinate.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${subordinate.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {subordinate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewCredentials(subordinate)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition"
                          >
                            <Eye className="w-4 h-4" />
                            Credentials
                          </button>
                          <button
                            onClick={() => handleResetPassword(subordinate._id)}
                            disabled={resettingPasswordId === subordinate._id}
                            className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${resettingPasswordId === subordinate._id ? 'animate-spin' : ''}`} />
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Credentials Modal */}
        {showCredentialModal && selectedUser && credentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Credentials for {selectedUser.name}</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={credentials.username}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded bg-slate-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(credentials.username);
                        alert('Copied!');
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      readOnly
                      value={credentials.email}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded bg-slate-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(credentials.email);
                        alert('Copied!');
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {tempPassword && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={tempPassword}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded bg-green-50 font-mono font-bold text-green-700"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tempPassword);
                          alert('Copied!');
                        }}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded">{credentials.note}</p>
              </div>

              <div className="flex gap-3">
                {!tempPassword && (
                  <button
                    onClick={() => handleResetPassword(selectedUser._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium transition"
                  >
                    <Key className="w-4 h-4" />
                    Generate Temp Password
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowCredentialModal(false);
                    setCredentials(null);
                    setTempPassword(null);
                  }}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-popover text-foreground rounded font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

