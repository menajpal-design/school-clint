'use client'

import React, { forwardRef } from 'react'
import { ProfessionalIDCard } from './ProfessionalIDCard'
import type { IDCardProps } from './StudentIDCard'

export type PreviewProps = IDCardProps & { type?: 'student' | 'teacher' | 'head' | 'staff' }

export const IDCardPreview = forwardRef<HTMLDivElement, PreviewProps>(function IDCardPreview(
  { type = 'student', ...props },
  ref
) {
  return (
    <div ref={ref as any} className="p-2 bg-slate-50 inline-block">
      <ProfessionalIDCard
        name={props.name}
        idNumber={props.id}
        role={type as any}
        photoUrl={props.photoUrl}
        institutionName={props.institution?.name || ''}
        institutionLogo={props.institution?.logoUrl}
        institutionAddress={props.institution?.address}
        institutionPhone={props.institution?.phone}
        institutionEmail={props.institution?.email}
        institutionWebsite={props.institution?.website}
        headName={props.headName || props.institution?.headName || ''}
        validityDate={props.validity}
        stream={props.studentClass}
        qrData={props.qrData}
      />
    </div>
  )
})

export default IDCardPreview
