'use client'

import React, { forwardRef } from 'react'
import StudentIDCard, { IDCardProps } from './StudentIDCard'
import TeacherIDCard from './TeacherIDCard'
import StaffIDCard from './StaffIDCard'

export type PreviewProps = IDCardProps & { type?: 'student' | 'teacher' | 'staff' }

export const IDCardPreview = forwardRef<HTMLDivElement, PreviewProps>(function IDCardPreview(
  { type = 'student', ...props },
  ref
) {
  const common = props
  return (
    <div ref={ref as any} className="p-2 bg-slate-50 inline-block">
      {type === 'teacher' ? (
        <TeacherIDCard {...common} />
      ) : type === 'staff' ? (
        <StaffIDCard {...common} />
      ) : (
        <StudentIDCard {...common} />
      )}
    </div>
  )
})

export default IDCardPreview
