'use client'

import React, { forwardRef } from 'react'
import { ProfessionalIDCard } from './ProfessionalIDCard'

export const IDCardPreview = forwardRef<HTMLDivElement, any>(function IDCardPreview(
  { type = 'student', ...props }: any,
  ref: any
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
