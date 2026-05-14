'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DownloadButtons from './DownloadButtons'
import { api } from '@/lib/api'
import { authManager } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

const toDateInputValue = (date: Date) => date.toISOString().split('T')[0]

const schema = z.object({
  cardType: z.enum(['student-id', 'teacher-id', 'head-id', 'staff-id', 'admit-card']).default('student-id'),
  name: z.string().min(1, 'Name is required'),
  idNumber: z.string().min(1, 'ID Number is required'),
  photoUrl: z.string().url().or(z.literal('')),
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionLogo: z.string().url().or(z.literal('')),
  validityDate: z.string(),
  headName: z.string(),
  dateOfBirth: z.string().or(z.literal('')),
  fatherName: z.string().or(z.literal('')),
  admissionNumber: z.string().or(z.literal('')),
  registrationNumber: z.string().or(z.literal('')),
  stream: z.string().or(z.literal('')),
  examName: z.string().or(z.literal('')),
  examDate: z.string().or(z.literal('')),
  examCenter: z.string().or(z.literal('')),
  centerCode: z.string().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const allCardTypes: Array<{ value: FormValues['cardType']; label: string; roles: string[] }> = [
  { value: 'student-id', label: 'Student ID Card', roles: ['head', 'assistant_head', 'staff', 'class_teacher'] },
  { value: 'teacher-id', label: 'Teacher ID Card', roles: ['head', 'assistant_head'] },
  { value: 'head-id', label: 'Head ID Card', roles: ['head', 'assistant_head'] },
  { value: 'staff-id', label: 'Staff ID Card', roles: ['head', 'assistant_head'] },
  { value: 'admit-card', label: 'Admit Card', roles: ['head', 'assistant_head', 'staff', 'student'] },
]

export function GenerateIDCardForm({ defaultCardType }: { defaultCardType?: FormValues['cardType'] } = {}) {
  const { user } = useAuth()
  const [sessionUser, setSessionUser] = useState<any>(null)
  useEffect(() => {
    setSessionUser(user || authManager.getUser())
  }, [user])
  const userRole = sessionUser?.role
  const visibleCardTypes = useMemo(
    () => allCardTypes.filter((type) => userRole && type.roles.includes(userRole)),
    [userRole]
  )
  const fallbackCardType = defaultCardType || visibleCardTypes[0]?.value || 'admit-card'
  const { register, watch, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardType: fallbackCardType,
      institutionName: '',
      headName: '',
      validityDate: toDateInputValue(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    },
  })

  const [students, setStudents] = useState<any[]>([])
  const cardType = watch('cardType')
  const formIsAdmitCard = cardType === 'admit-card'
  const liveCardType = useWatch({ control, name: 'cardType' }) || fallbackCardType
  const liveName = useWatch({ control, name: 'name' }) || ''
  const liveIdNumber = useWatch({ control, name: 'idNumber' }) || ''
  const livePhotoUrl = useWatch({ control, name: 'photoUrl' }) || ''
  const liveInstitutionName = useWatch({ control, name: 'institutionName' }) || ''
  const liveInstitutionLogo = useWatch({ control, name: 'institutionLogo' }) || ''
  const liveHeadName = useWatch({ control, name: 'headName' }) || ''
  const liveDateOfBirth = useWatch({ control, name: 'dateOfBirth' }) || ''
  const liveFatherName = useWatch({ control, name: 'fatherName' }) || ''
  const liveAdmissionNumber = useWatch({ control, name: 'admissionNumber' }) || ''
  const liveRegistrationNumber = useWatch({ control, name: 'registrationNumber' }) || ''
  const liveStream = useWatch({ control, name: 'stream' }) || ''
  const liveExamName = useWatch({ control, name: 'examName' }) || ''
  const liveExamDate = useWatch({ control, name: 'examDate' }) || ''
  const liveExamCenter = useWatch({ control, name: 'examCenter' }) || ''
  const liveCenterCode = useWatch({ control, name: 'centerCode' }) || ''
  const liveValidityDate = useWatch({ control, name: 'validityDate' }) || ''
  const formData: FormValues = {
    cardType: liveCardType as any,
    name: liveName,
    idNumber: liveIdNumber,
    photoUrl: livePhotoUrl,
    institutionName: liveInstitutionName,
    institutionLogo: liveInstitutionLogo,
    headName: liveHeadName,
    dateOfBirth: liveDateOfBirth,
    fatherName: liveFatherName,
    admissionNumber: liveAdmissionNumber,
    registrationNumber: liveRegistrationNumber,
    stream: liveStream,
    examName: liveExamName,
    examDate: liveExamDate,
    examCenter: liveExamCenter,
    centerCode: liveCenterCode,
    validityDate: liveValidityDate,
  }

  useEffect(() => {
    if (visibleCardTypes.length > 0 && !visibleCardTypes.some((type) => type.value === cardType)) {
      setValue('cardType', visibleCardTypes[0].value)
    }
  }, [cardType, setValue, visibleCardTypes])

  useEffect(() => {
    const institutionFromSession = sessionUser?.institution as any
    if (institutionFromSession?.name) setValue('institutionName', institutionFromSession.name)
    if (sessionUser?.role === 'head' && sessionUser.name) setValue('headName', sessionUser.name)

    api.institution.profile()
      .then((response: any) => {
        const institution = response?.institution
        if (!institution) return
        const head = institution.headId
        const headName = typeof head === 'object' ? head?.name : undefined

        if (institution.name) setValue('institutionName', institution.name)
        if (institution.logo) setValue('institutionLogo', institution.logo)
        if (headName) setValue('headName', headName)
      })
      .catch(() => undefined)
  }, [sessionUser, setValue])

  useEffect(() => {
    if (!formIsAdmitCard) return
    // load students for selection
    api.students.getAll()
      .then((res: any) => {
        // res may be an array or { students }
        const list = Array.isArray(res) ? res : res?.students || []
        setStudents(list || [])
      })
      .catch(() => setStudents([]))
  }, [formIsAdmitCard])

  const onSelectStudent = async (studentId: string) => {
    if (!studentId) return
    try {
      const student = await api.students.getById(studentId) as any
      if (!student) return
      const user = student.userId || {}
      // populate form fields
      setValue('name', user.name || `${student.firstName || ''} ${student.lastName || ''}`.trim())
      setValue('photoUrl', user.avatar || '')
      setValue('idNumber', student.rollNumber || student.admissionNumber || student._id)
      setValue('dateOfBirth', user.dateOfBirth || '')
      setValue('fatherName', student.fatherName || '')
      setValue('stream', (student.classId && (student.classId.name || '')) || student.stream || '')
      // exam defaults can stay; set admission/reg numbers
      setValue('admissionNumber', student.admissionNumber || '')
      setValue('registrationNumber', student.registrationNumber || '')
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(900px, 1fr)', gap: '24px', width: '100%', minWidth: 0 }}>
      {/* Form Section */}
      <div style={{ minWidth: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Generate ID Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {visibleCardTypes.length > 1 ? (
                <div>
                  <label className="text-sm font-semibold">Card Type</label>
                  <select
                    {...register('cardType')}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    {visibleCardTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input type="hidden" {...register('cardType')} />
              )}

              {/* Basic Information */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Personal Information</h3>
                {formIsAdmitCard && (
                  <div>
                    <label className="text-sm">Select Student</label>
                    <select onChange={(e) => onSelectStudent(e.target.value)} className="w-full border rounded px-3 py-2 mt-1">
                      <option value="">-- Choose student to autofill --</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>{s.userId?.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s._id}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm">Full Name</label>
                  <Input {...register('name')} placeholder="e.g., Arjun Kumar Singh" />
                </div>
                <div>
                  <label className="text-sm">ID / Roll Number</label>
                  <Input
                    {...register('idNumber')}
                  placeholder={formIsAdmitCard ? 'e.g., A-101' : 'e.g., STU-2024-001'}
                  />
                </div>
                <div>
                  <label className="text-sm">Photo URL</label>
                  <Input
                    {...register('photoUrl')}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              {/* Institution Information */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Institution Information</h3>
                <div>
                  <label className="text-sm">Institution Name</label>
                  <Input {...register('institutionName')} placeholder="e.g., Modern Public School" />
                </div>
                <div>
                  <label className="text-sm">Institution Logo URL</label>
                  <Input {...register('institutionLogo')} placeholder="https://example.com/logo.png" />
                </div>
                <div>
                  <label className="text-sm">Principal / Head Name</label>
                  <Input {...register('headName')} placeholder="Dr. Ramesh Sharma" />
                </div>
              </div>

              {/* Card-Specific Fields */}
              {formIsAdmitCard ? (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-sm">Examination Information</h3>
                  <div>
                    <label className="text-sm">Exam Name</label>
                    <Input {...register('examName')} placeholder="e.g., Annual Examination 2024" />
                  </div>
                  <div>
                    <label className="text-sm">Exam Date</label>
                    <Input {...register('examDate')} placeholder="e.g., 2024-02-15" type="date" />
                  </div>
                  <div>
                    <label className="text-sm">Exam Center</label>
                    <Input {...register('examCenter')} placeholder="e.g., School Campus, Hall A" />
                  </div>
                  <div>
                    <label className="text-sm">Center Code</label>
                    <Input {...register('centerCode')} placeholder="e.g., CENTER-001" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-sm">Additional Information</h3>
                  <div>
                    <label className="text-sm">Validity Date</label>
                    <Input {...register('validityDate')} type="date" />
                  </div>
                  <div>
                    <label className="text-sm">Date of Birth</label>
                    <Input {...register('dateOfBirth')} type="date" />
                  </div>
                  <div>
                    <label className="text-sm">Father's Name</label>
                    <Input {...register('fatherName')} placeholder="e.g., Mr. Rajesh Kumar" />
                  </div>
                  <div>
                    <label className="text-sm">Admission Number</label>
                    <Input {...register('admissionNumber')} placeholder="e.g., ADM/2023/1001" />
                  </div>
                  <div>
                    <label className="text-sm">Registration Number</label>
                    <Input {...register('registrationNumber')} placeholder="e.g., REG/2023/001" />
                  </div>
                  {cardType === 'student-id' && (
                    <div>
                      <label className="text-sm">Stream / Class</label>
                      <Input {...register('stream')} placeholder="e.g., Science (PCM)" />
                    </div>
                  )}
                </div>
              )}

            </form>
          </CardContent>
        </Card>
      </div>

      {/* Download Section */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Download PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Server-side PDF generation</p>
              <p className="mt-1">The PDF is rendered on the server with a fixed A4-safe layout, so zoom level and device size do not change the result.</p>
            </div>

            <div className="mt-6">
              <DownloadButtons
                targetRef={null}
                formData={formData}
                filename={`${formData.cardType}-${formData.idNumber || 'card'}`}
                printTitle={`${formData.cardType} Card`}
                emailSubject={`${formData.cardType} Card`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default GenerateIDCardForm

