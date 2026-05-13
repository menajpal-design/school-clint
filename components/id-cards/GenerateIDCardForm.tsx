'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfessionalIDCard } from './ProfessionalIDCard'
import { AdmitCard } from './AdmitCard'
import DownloadButtons from './DownloadButtons'
import { api } from '@/lib/api'
import { authManager } from '@/lib/auth'

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

export function GenerateIDCardForm() {
  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardType: 'student-id',
      institutionName: 'Educational Institution',
      headName: 'Institution Head',
      validityDate: toDateInputValue(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    },
  })

  const [data, setData] = useState<FormValues | null>(null)
  const [institutionProfile, setInstitutionProfile] = useState<any>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const cardType = watch('cardType')
  const formIsAdmitCard = cardType === 'admit-card'

  useEffect(() => {
    const user = authManager.getUser()
    const institutionFromSession = user?.institution as any
    if (institutionFromSession?.name) setValue('institutionName', institutionFromSession.name)
    if (user?.role === 'head' && user.name) setValue('headName', user.name)

    api.institution.profile()
      .then((response: any) => {
        const institution = response?.institution
        if (!institution) return
        setInstitutionProfile(institution)
        const head = institution.headId
        const headName = typeof head === 'object' ? head?.name : undefined

        if (institution.name) setValue('institutionName', institution.name)
        if (institution.logo) setValue('institutionLogo', institution.logo)
        if (headName) setValue('headName', headName)
      })
      .catch(() => undefined)
  }, [setValue])

  const onSubmit = (vals: FormValues) => {
    setData(vals)
  }

  const isAdmitCard = data?.cardType === 'admit-card'

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Form Section */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Generate ID Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Card Type */}
              <div>
                <label className="text-sm font-semibold">Card Type</label>
                <select
                  {...register('cardType')}
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="student-id">Student ID Card</option>
                  <option value="teacher-id">Teacher ID Card</option>
                  <option value="head-id">Head ID Card</option>
                  <option value="staff-id">Staff ID Card</option>
                  <option value="admit-card">Admit Card</option>
                </select>
              </div>

              {/* Basic Information */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Personal Information</h3>
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

              <Button type="submit" className="w-full">
                Generate Preview
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Card Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={previewRef} className="flex justify-center min-h-96">
              {data ? (
                <>
                  {isAdmitCard ? (
                    <AdmitCard
                      name={data.name}
                      rollNumber={data.idNumber}
                      photoUrl={data.photoUrl || undefined}
                      institutionName={data.institutionName}
                      institutionLogo={data.institutionLogo || undefined}
                      institutionSeal={institutionProfile?.seal}
                      headSignature={institutionProfile?.headSignature}
                      examName={data.examName}
                      examDate={data.examDate}
                      examCenter={data.examCenter}
                      centerCode={data.centerCode}
                      headName={data.headName}
                      dateOfBirth={data.dateOfBirth || undefined}
                      fatherName={data.fatherName || undefined}
                      stream={data.stream || undefined}
                    />
                  ) : (
                    <ProfessionalIDCard
                      name={data.name}
                      idNumber={data.idNumber}
                      role={
                        data.cardType === 'student-id'
                          ? 'student'
                          : data.cardType === 'teacher-id'
                            ? 'teacher'
                            : data.cardType === 'head-id'
                              ? 'head'
                            : 'staff'
                      }
                      photoUrl={data.photoUrl || undefined}
                      institutionName={data.institutionName}
                      institutionLogo={data.institutionLogo || undefined}
                      institutionSeal={institutionProfile?.seal}
                      headSignature={institutionProfile?.headSignature}
                      validityDate={data.validityDate}
                      headName={data.headName}
                      dateOfBirth={data.dateOfBirth || undefined}
                      fatherName={data.fatherName || undefined}
                      admissionNumber={data.admissionNumber || undefined}
                      registrationNumber={data.registrationNumber || undefined}
                      stream={data.stream || undefined}
                    />
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500">
                  <p>Fill the form and click "Generate Preview"</p>
                  <p className="text-sm mt-2">Your card will appear here</p>
                </div>
              )}
            </div>

            {data && (
              <div className="mt-6">
                <DownloadButtons
                  targetRef={previewRef}
                  filename={`${data.cardType}-${data.idNumber}`}
                  cardId={data.idNumber}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default GenerateIDCardForm
