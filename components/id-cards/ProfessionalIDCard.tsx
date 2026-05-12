'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface ProfessionalIDCardProps {
  name: string
  idNumber: string
  role: 'student' | 'teacher' | 'staff'
  className?: string
  photoUrl?: string
  institutionName?: string
  institutionLogo?: string
  validityDate?: string
  headName?: string
  dateOfBirth?: string
  fatherName?: string
  motherName?: string
  admissionNumber?: string
  registrationNumber?: string
}

export const ProfessionalIDCard = React.forwardRef<HTMLDivElement, ProfessionalIDCardProps>(
  (
    {
      name,
      idNumber,
      role,
      className = '',
      photoUrl,
      institutionName = 'Educational Institution',
      institutionLogo,
      validityDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      headName = 'Dr. Principal',
      dateOfBirth,
      fatherName,
      motherName,
      admissionNumber,
      registrationNumber,
    },
    ref
  ) => {
    // QR code data: JSON with card details
    const qrData = JSON.stringify({
      name,
      id: idNumber,
      role,
      institution: institutionName,
      validity: validityDate,
    })

    const roleLabel = {
      student: 'Student ID Card',
      teacher: 'Faculty ID Card',
      staff: 'Staff ID Card',
    }[role]

    const roleColor = {
      student: 'bg-gradient-to-br from-blue-600 to-blue-800',
      teacher: 'bg-gradient-to-br from-green-600 to-green-800',
      staff: 'bg-gradient-to-br from-purple-600 to-purple-800',
    }[role]

    return (
      <div ref={ref} className={`w-full max-w-md ${className}`}>
        {/* Front Side */}
        <div className={`${roleColor} text-white rounded-lg overflow-hidden shadow-lg`}>
          {/* Header */}
          <div className="px-6 py-4 border-b-4 border-white/30">
            <div className="flex items-center justify-between mb-2">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo"
                  className="h-12 w-12 object-contain bg-white/20 rounded p-1"
                />
              ) : (
                <div className="h-12 w-12 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-sm font-bold">Logo</span>
                </div>
              )}
              <div className="flex-1 ml-4 text-center">
                <h2 className="text-xl font-bold">{institutionName}</h2>
                <p className="text-sm font-semibold opacity-90">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 py-4">
            <div className="flex gap-4 mb-4">
              {/* Photo Section */}
              <div className="flex-shrink-0">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-24 w-20 object-cover rounded border-2 border-white"
                  />
                ) : (
                  <div className="h-24 w-20 bg-white/20 rounded border-2 border-white flex items-center justify-center text-xs text-center">
                    Photo
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex-1">
                <div className="mb-2">
                  <p className="text-xs opacity-75">Full Name</p>
                  <p className="text-lg font-bold">{name}</p>
                </div>
                <div className="mb-2">
                  <p className="text-xs opacity-75">ID Number</p>
                  <p className="font-mono text-sm font-bold">{idNumber}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Valid Until</p>
                  <p className="text-sm font-semibold">{validityDate}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={qrData} size={80} level="M" includeMargin={false} />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(dateOfBirth || admissionNumber || registrationNumber) && (
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                {dateOfBirth && (
                  <div>
                    <p className="opacity-75">Date of Birth</p>
                    <p className="font-semibold">{dateOfBirth}</p>
                  </div>
                )}
                {admissionNumber && (
                  <div>
                    <p className="opacity-75">Admission No.</p>
                    <p className="font-semibold">{admissionNumber}</p>
                  </div>
                )}
                {registrationNumber && (
                  <div>
                    <p className="opacity-75">Registration No.</p>
                    <p className="font-semibold">{registrationNumber}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/30">
              <div>
                <p className="text-xs opacity-75">Authorized By</p>
                <p className="text-sm font-semibold">{headName}</p>
                <p className="text-xs opacity-75">Principal</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded border-2 border-white flex items-center justify-center text-xs">
                  Seal
                </div>
              </div>
              <div className="text-right text-xs">
                <p>Issue Date:</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="px-6 py-2 bg-white/10 text-center text-xs italic">
            This card is the official property of {institutionName}. Loss must be reported immediately.
          </div>
        </div>
      </div>
    )
  }
)

ProfessionalIDCard.displayName = 'ProfessionalIDCard'

export default ProfessionalIDCard
