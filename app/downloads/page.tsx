'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Downloads() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/app-debug.apk';
    link.download = 'EasyStudy.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">EasyStudy Mobile App</h1>
          <p className="text-lg text-gray-600">Download our native Android application</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* App Info */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-indigo-600 p-4 rounded-lg">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Android Application</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📋 App Details:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>✓ Version: 1.0 (Debug)</li>
                <li>✓ Size: 7.3 MB</li>
                <li>✓ Minimum Android: 6.0 (API 24)</li>
                <li>✓ Target Android: 13+ (API 36+)</li>
                <li>✓ Built: Native Kotlin</li>
              </ul>
            </div>
          </div>

          {/* Download Button */}
          <div className="mb-8">
            <button
              onClick={handleDownload}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download APK
            </button>
            {downloadStarted && (
              <p className="text-green-600 text-sm mt-2 text-center">✓ Download started!</p>
            )}
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">🎯 Features Included:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>✓ Authentication & Login</div>
              <div>✓ Dashboard with Charts</div>
              <div>✓ Academic Module</div>
              <div>✓ Attendance Tracking</div>
              <div>✓ Finance Management</div>
              <div>✓ ID Cards Generation</div>
              <div>✓ Documents Upload</div>
              <div>✓ Notices & Alerts</div>
              <div>✓ Navigation Drawer</div>
              <div>✓ User Profile</div>
              <div>✓ Settings Screen</div>
              <div>✓ Offline Session</div>
            </div>
          </div>

          {/* Installation Guide */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-bold text-yellow-900 mb-4">📱 Installation Steps:</h3>
            <ol className="text-yellow-800 space-y-3 text-sm">
              <li><strong>1. Download:</strong> Click the download button above</li>
              <li><strong>2. Allow Unknown Sources:</strong> Go to Settings → Security → Allow Unknown Sources</li>
              <li><strong>3. Install:</strong> Open the APK file and tap Install</li>
              <li><strong>4. Launch:</strong> Open EasyStudy app from your home screen</li>
              <li><strong>5. Login:</strong> Use your school email and password</li>
            </ol>
          </div>
        </div>

        {/* Login Credentials */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-green-900 mb-3">🔑 Test Credentials:</h3>
          <div className="bg-white rounded p-3 text-sm text-gray-700 font-mono">
            <p><strong>Email:</strong> head@school.com</p>
            <p><strong>Password:</strong> password123</p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* System Requirements */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <p><strong>System Requirements:</strong> Android 6.0 or higher with at least 50MB free storage space. Internet connection required for initial login and data sync.</p>
        </div>
      </div>
    </div>
  );
}
