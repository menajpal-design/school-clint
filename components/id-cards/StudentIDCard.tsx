'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface StudentIDCardProps {
  name: string
  id: string
  session: string
  phone: string
  email: string
  photoUrl: string
  institutionName?: string
  institutionAddress?: string
  institutionWebsite?: string
  institutionPhone?: string
  institutionEmail?: string
  instructions?: string[]
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="grid grid-cols-[104px_1fr] gap-3 items-start">
    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-900 min-h-[18px]">{value || ''}</span>
  </div>
)

const StudentCard = ({ data, id }: { data: StudentIDCardProps; id: string }) => {
  const instructions = data.instructions && data.instructions.length > 0
    ? data.instructions
    : [
        'Card must be presented on demand.',
        'Loss must be reported to the office immediately.',
        'Finder must return this card to the issuing institute.',
      ]

  return (
    <div id={id} className="flex flex-wrap gap-8 justify-center p-8 bg-transparent print:p-0 print:m-0 print:bg-white">
      <div className="w-[350px] h-[520px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl print:border-0 print:shadow-none">
        <div className="h-28 bg-gradient-to-r from-sky-700 to-cyan-500 px-6 py-5 text-white">
          <div className="text-[10px] uppercase tracking-[0.34em]">Student ID Card</div>
          <div className="mt-3 text-2xl font-black leading-tight">{data.institutionName || ''}</div>
        </div>

        <div className="px-6 py-5">
          <div className="-mt-16 flex justify-center">
            <div className="relative w-28 h-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl">
              {data.photoUrl ? (
                <img src={data.photoUrl} alt={data.name || 'Student'} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-slate-200" />
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Student</div>
            <h2 className="mt-2 text-2xl font-black text-slate-900 leading-snug">{data.name || ''}</h2>
          </div>

          <div className="mt-6 space-y-3">
            <InfoRow label="ID No" value={data.id} />
            <InfoRow label="Session" value={data.session} />
            <InfoRow label="Phone" value={data.phone} />
            <InfoRow label="Email" value={data.email} />
          </div>
        </div>

        <div className="mt-auto rounded-t-[32px] bg-slate-900 px-6 py-4 text-white">
          <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300">Valid Until</div>
          <div className="mt-2 text-base font-semibold">{data.session || ''}</div>
        </div>
      </div>

      <div className="w-[350px] h-[520px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl print:border-0 print:shadow-none">
        <div className="h-24 bg-slate-900 px-6 py-5 text-white flex items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Back Side</div>
            <div className="mt-3 text-2xl font-black">Student Details</div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid gap-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
                <span>{instruction}</span>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Institution Details</div>
            <div className="mt-3 space-y-2 text-sm text-slate-900">
              <div>{data.institutionAddress || ''}</div>
              <div>{data.institutionPhone || ''}</div>
              <div>{data.institutionEmail || ''}</div>
              <div>{data.institutionWebsite || ''}</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-[11px] leading-5 text-slate-600">
            <div className="font-semibold text-slate-900 uppercase tracking-[0.25em] mb-3">Important</div>
            <div className="space-y-2">
              <div>Non-transferable card.</div>
              <div>Carry card on campus.</div>
              <div>Report loss immediately.</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900" />
      </div>
    </div>
  )
}

export const StudentIDCard = React.forwardRef<HTMLDivElement, StudentIDCardProps>(
  (props, ref) => (
    <div ref={ref}>
      <StudentCard data={props} id="student-card" />
    </div>
  )
)

StudentIDCard.displayName = 'StudentIDCard'

export default StudentIDCard
