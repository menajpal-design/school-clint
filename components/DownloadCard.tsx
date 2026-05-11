'use client';

import Link from 'next/link';

export default function DownloadCard() {
  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2">📱 Mobile App Available</h3>
          <p className="text-sm opacity-90">Download EasyStudy native Android app now!</p>
        </div>
        <Link
          href="/downloads"
          className="bg-white text-blue-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition duration-200"
        >
          Download
        </Link>
      </div>
    </div>
  );
}
