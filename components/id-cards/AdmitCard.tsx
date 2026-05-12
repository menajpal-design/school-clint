'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface AdmitCardProps {
  name: string
  rollNumber: string
  className?: string
  photoUrl?: string
  institutionName?: string
  institutionLogo?: string
  examName?: string
  examDate?: string
  examCenter?: string
  centerCode?: string
  headName?: string
  dateOfBirth?: string
  fatherName?: string
  stream?: string
}

export const AdmitCard = React.forwardRef<HTMLDivElement, AdmitCardProps>(
  (
    {
      name,
      rollNumber,
      className = '',
      photoUrl,
      institutionName = 'Educational Institution',
      institutionLogo,
      examName = 'Annual Examination',
      examDate,
      examCenter,
      centerCode,
      headName = 'Dr. Principal',
      dateOfBirth,
      fatherName,
      stream,
    },
    ref
  ) => {
    // QR code data: JSON with admit details
    const qrData = JSON.stringify({
      name,
      roll: rollNumber,
      exam: examName,
      center: centerCode,
      date: examDate,
      institution: institutionName,
    })

    return (
      <div ref={ref} className={`w-full max-w-md ${className}`}>
        {/* Admit Card */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-4 border-amber-800 rounded-lg overflow-hidden shadow-lg">
          {/* Header with Green Band */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3">
            <div className="flex items-center justify-between">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo"
                  className="h-12 w-12 object-contain bg-white/20 rounded-full p-1"
                />
              ) : (
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                  Logo
                </div>
              )}
              <div className="flex-1 mx-4 text-center">
                <h1 className="text-xl font-bold">{institutionName}</h1>
                <p className="text-sm font-semibold opacity-90">Admit Card</p>
              </div>
              <div className="text-right text-xs">
                <p>Roll No:</p>
                <p className="text-lg font-bold font-mono">{rollNumber}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 py-4 bg-white">
            {/* Exam Info Bar */}
            {(examName || examDate) && (
              <div className="bg-amber-100 border-l-4 border-amber-800 px-3 py-2 mb-4 rounded">
                <p className="text-xs font-bold text-amber-900">EXAMINATION DETAILS</p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                  <div>
                    <span className="font-semibold">Exam:</span> {examName}
                  </div>
                  {examDate && (
                    <div>
                      <span className="font-semibold">Date:</span> {examDate}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student Details */}
            <div className="flex gap-4 mb-4">
              {/* Photo */}
              <div className="flex-shrink-0">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-28 w-24 object-cover rounded border-2 border-green-600"
                  />
                ) : (
                  <div className="h-28 w-24 bg-slate-200 rounded border-2 border-green-600 flex items-center justify-center text-xs text-center">
                    Student<br />Photo
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600">Student Name</p>
                  <p className="text-lg font-bold text-green-800">{name}</p>
                </div>

                {dateOfBirth && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600">Date of Birth</p>
                    <p className="text-sm font-semibold">{dateOfBirth}</p>
                  </div>
                )}

                {stream && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Stream/Class</p>
                    <p className="text-sm font-semibold">{stream}</p>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="bg-white border-2 border-green-600 p-2 rounded">
                  <QRCodeSVG value={qrData} size={96} level="M" includeMargin={false} />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-400 my-3"></div>

            {/* Exam Center & Father Name */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              {examCenter && (
                <div>
                  <p className="font-semibold text-gray-700">Exam Center</p>
                  <p className="font-bold text-green-800">{examCenter}</p>
                </div>
              )}
              {centerCode && (
                <div>
                  <p className="font-semibold text-gray-700">Center Code</p>
                  <p className="font-mono font-bold">{centerCode}</p>
                </div>
              )}
              {fatherName && (
                <div className="col-span-2">
                  <p className="font-semibold text-gray-700">Father's Name</p>
                  <p>{fatherName}</p>
                </div>
              )}
            </div>

            {/* Important Instructions */}
            <div className="bg-red-50 border-l-4 border-red-600 px-3 py-2 mb-4 rounded text-xs">
              <p className="font-bold text-red-800 mb-1">⚠ IMPORTANT INSTRUCTIONS</p>
              <ul className="list-disc list-inside space-y-1 text-red-900">
                <li>Present this admit card along with valid ID</li>
                <li>Arrive 30 minutes before exam start time</li>
                <li>Keep original documents safe</li>
                <li>Report any discrepancies to the office</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between pt-3 border-t-2 border-gray-300">
              <div>
                <p className="text-xs text-gray-600">Issue Date</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-gray-100 rounded border-2 border-green-600 flex items-center justify-center text-xs font-bold text-gray-600">
                  Seal &amp;<br />Signature
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-2">Authorized by</p>
                <p className="text-sm font-bold text-green-800">{headName}</p>
                <p className="text-xs text-gray-600">Principal</p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="bg-gray-800 text-white text-center py-2 text-xs">
            <p className="font-semibold">This admit card is valid only for the prescribed examination</p>
          </div>
        </div>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
