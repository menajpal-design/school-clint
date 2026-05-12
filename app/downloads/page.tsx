'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Release {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    download_count: number;
    size: number;
  }>;
}

export default function Downloads() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localDownload, setLocalDownload] = useState(false);
  const githubOwner = process.env.NEXT_PUBLIC_GITHUB_OWNER || 'YOUR_USERNAME';
  const githubRepo = process.env.NEXT_PUBLIC_GITHUB_REPO || 'school_n';
  const releasesUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/releases`;
  const fallbackApkUrl = process.env.NEXT_PUBLIC_LOCAL_APK_URL || '/app-debug.apk';

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const response = await fetch(releasesUrl, { headers: { 'Accept': 'application/vnd.github+json' } });
        
        if (response.ok) {
          const data = await response.json();
          setReleases(data);
          setError(null);
        } else {
          setError('GitHub releases পাওয়া যায়নি, local APK ব্যবহার করা হবে।');
        }
      } catch (err) {
        console.log('Could not fetch from GitHub, using local version');
        setError('GitHub releases পাওয়া যায়নি, local APK ব্যবহার করা হবে।');
        setReleases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const handleLocalDownload = () => {
    setLocalDownload(true);
    const link = document.createElement('a');
    link.href = fallbackApkUrl;
    link.download = 'SchoolApp.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const latestReleaseAsset = releases
    .flatMap((release) => release.assets)
    .find((asset) => asset.name.toLowerCase().endsWith('.apk'));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">অ্যাপ ডাউনলোড করুন</h1>
          <p className="text-lg text-gray-600">স্কুল ম্যানেজমেন্ট সিস্টেম - নেটিভ এন্ড্রয়েড অ্যাপ</p>
        </div>

        {/* Featured Download */}
        {!loading && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">সর্বশেষ অ্যাপ পান</h2>
                <p className="text-blue-100">নেটিভ কটলিন দিয়ে তৈরি, দ্রুত এবং নির্ভরযোগ্য</p>
              </div>
              {latestReleaseAsset ? (
                <a
                  href={latestReleaseAsset.browser_download_url}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  সর্বশেষ APK ডাউনলোড
                </a>
              ) : (
                <button
                  onClick={handleLocalDownload}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  এখনই ডাউনলোড করুন
                </button>
              )}
            </div>
            {localDownload && (
              <p className="text-blue-100 text-sm mt-4">✓ ডাউনলোড শুরু হয়েছে...</p>
            )}
            {error && <p className="text-blue-100 text-sm mt-2">{error}</p>}
          </div>
        )}

        {/* GitHub Releases Section */}
        {!loading && releases.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 সকল রিলিজ</h2>
            <div className="space-y-4">
              {releases.map((release) => (
                <div key={release.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{release.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        প্রকাশ: {formatDate(release.published_at)}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {release.tag_name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {release.assets.map((asset) => (
                      <a
                        key={asset.name}
                        href={asset.browser_download_url}
                        download
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span>📥</span>
                          <div>
                            <p className="font-semibold text-gray-900">{asset.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(asset.size)} • {asset.download_count} ডাউনলোড
                            </p>
                          </div>
                        </div>
                        <span className="text-blue-600 text-sm font-semibold">ডাউনলোড</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Installation Guide */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 ইনস্টলেশন গাইড</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">APK ডাউনলোড করুন</h3>
                <p className="text-gray-600 text-sm">উপরে থেকে অ্যাপ্লিকেশন ফাইল ডাউনলোড করুন।</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">অজানা উৎস সক্ষম করুন</h3>
                <p className="text-gray-600 text-sm">সেটিংস → অ্যাপ সেকিউরিটি → অজানা উৎস থেকে অ্যাপ ইনস্টলেশন</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ফাইল ওপেন করুন</h3>
                <p className="text-gray-600 text-sm">ডাউনলোড করা APK ফাইল খুলুন এবং ইনস্টল বাটন চাপুন।</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">অ্যাপ চালু করুন</h3>
                <p className="text-gray-600 text-sm">ইনস্টলেশন সম্পূর্ণ হলে অ্যাপটি খুলুন এবং লগইন করুন।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">✨ প্রধান বৈশিষ্ট্য</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">✓ <span>নেটিভ এন্ড্রয়েড (কটলিন)</span></li>
              <li className="flex items-center gap-2">✓ <span>দ্রুত এবং নির্ভরযোগ্য</span></li>
              <li className="flex items-center gap-2">✓ <span>ড্যাশবোর্ড এবং পরিসংখ্যান</span></li>
              <li className="flex items-center gap-2">✓ <span>উপস্থিতি ট্র্যাকিং</span></li>
              <li className="flex items-center gap-2">✓ <span>বার্তা এবং নোটিস</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 সিস্টেম প্রয়োজনীয়তা</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">✓ <span>এন্ড্রয়েড ৬.০+</span></li>
              <li className="flex items-center gap-2">✓ <span>১০০+ MB ফ্রি স্পেস</span></li>
              <li className="flex items-center gap-2">✓ <span>ইন্টারনেট সংযোগ</span></li>
              <li className="flex items-center gap-2">✓ <span>২GB RAM প্রস্তাবিত</span></li>
              <li className="flex items-center gap-2">✓ <span>বর্তমান ডিভাইসে পরীক্ষিত</span></li>
            </ul>
          </div>
        </div>

        {/* Support */}
        <div className="bg-indigo-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-indigo-900 mb-3">❓ সহায়তা প্রয়োজন?</h3>
          <p className="text-indigo-700 mb-4">সমস্যা বা প্রশ্ন থাকলে</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={`https://github.com/${githubOwner}/${githubRepo}/issues`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition">
              GitHub Issues
            </a>
            <Link href="/dashboard" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition">
              ড্যাশবোর্ডে ফিরুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
