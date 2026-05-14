'use client'

import { useEffect, useState } from 'react'
import { Layers, Eye } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfessionalIDCard } from '@/components/id-cards/ProfessionalIDCard'
import { AdmitCard } from '@/components/id-cards/AdmitCard'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

type InstitutionProfile = {
  _id?: string
  name?: string
  logo?: string
  seal?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  headSignature?: string
  billing?: {
    subscriptionExpiresAt?: string
  }
  headId?: {
    name?: string
  }
}

const cardTemplates = [
  {
    id: 'student',
    name: 'Student ID Card',
    description: 'Professional student identification card with QR code',
    type: 'student',
    role: 'student',
  },
  {
    id: 'teacher',
    name: 'Faculty ID Card',
    description: 'Faculty/Teacher identification card with institutional branding',
    type: 'teacher',
    role: 'teacher',
  },
  {
    id: 'staff',
    name: 'Staff ID Card',
    description: 'Administrative staff identification card',
    type: 'staff',
    role: 'staff',
  },
  {
    id: 'admit',
    name: 'Admit Card',
    description: 'Examination admit card with exam details and QR code',
    type: 'admit',
    role: 'admit',
  },
]

export default function TemplatesPage() {
  const { user } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState('student')
  const [previewMode, setPreviewMode] = useState<'grid' | 'full'>('grid')
  const [institution, setInstitution] = useState<InstitutionProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const currentTemplate = cardTemplates.find((t) => t.id === selectedTemplate)

  useEffect(() => {
    let mounted = true

    api.institution.profile()
      .then((data: any) => {
        if (!mounted) return
        setInstitution(data?.institution || null)
      })
      .catch(() => {
        if (!mounted) return
        setInstitution(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const institutionName = institution?.name || user?.institution?.name || 'Live Institution Preview'
  const institutionLogo = institution?.logo || user?.institution?.logo
  const institutionSeal = institution?.seal
  const institutionAddress = institution?.address || user?.institution?.address
  const institutionPhone = institution?.phone || user?.institution?.phone
  const institutionEmail = institution?.email || user?.institution?.email
  const institutionWebsite = institution?.website || user?.institution?.website
  const headName = institution?.headId?.name || user?.name || ''
  const liveIdentity = user?.name || institutionName
  const liveIdNumber = user?.id || institution?._id || ''
  const validityDate = institution?.billing?.subscriptionExpiresAt || undefined
  const examLabel = institutionName ? `${institutionName} Examination` : 'Live Examination'
  const livePhotoUrl = user?.avatar

  return (
    <div className="space-y-8">
      <PageHeader
        title="ID Card Templates"
        description="Professional card templates with QR code integration. Preview data is pulled from the live institution profile and current user."
        icon={Layers}
        status={<Badge variant="outline">Professional Templates</Badge>}
      />

      {/* Template Selection */}
      <section className="grid gap-4 md:grid-cols-4">
        {cardTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer overflow-hidden rounded-3xl border border-border bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              selectedTemplate === template.id
                ? 'border-cyan-500 ring-2 ring-cyan-200'
                : 'border-slate-200 hover:border-cyan-300'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-xs leading-5">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                size="sm"
                variant={selectedTemplate === template.id ? 'default' : 'outline'}
                className="w-full"
              >
                {selectedTemplate === template.id ? '✓ Selected' : 'Select'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Preview Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={previewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMode('grid')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Grid View
        </Button>
        <Button
          variant={previewMode === 'full' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMode('full')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Full View
        </Button>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 shadow-lg">
        <CardHeader>
          <CardTitle>{currentTemplate?.name} Preview</CardTitle>
          <CardDescription>
            This template uses live profile data where available, so the preview reflects the current institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Loading live profile data...
            </div>
          )}
          <div
            className={`flex ${previewMode === 'full' ? 'justify-center' : 'overflow-x-auto'}`}
          >
            <div className={previewMode === 'full' ? '' : 'min-w-max pr-4'}>
              {selectedTemplate === 'student' && (
                <ProfessionalIDCard
                  name={liveIdentity}
                  idNumber={liveIdNumber || liveIdentity}
                  role="student"
                  photoUrl={livePhotoUrl}
                  institutionName={institutionName}
                  institutionLogo={institutionLogo}
                  institutionAddress={institutionAddress}
                  institutionPhone={institutionPhone}
                  institutionEmail={institutionEmail}
                  institutionWebsite={institutionWebsite}
                  institutionSeal={institutionSeal}
                  headName={headName}
                  validityDate={validityDate}
                  stream={user?.role ? user.role.replace(/_/g, ' ') : institutionName}
                />
              )}
              {selectedTemplate === 'teacher' && (
                <ProfessionalIDCard
                  name={liveIdentity}
                  idNumber={liveIdNumber || liveIdentity}
                  role="teacher"
                  photoUrl={livePhotoUrl}
                  institutionName={institutionName}
                  institutionLogo={institutionLogo}
                  institutionAddress={institutionAddress}
                  institutionPhone={institutionPhone}
                  institutionEmail={institutionEmail}
                  institutionWebsite={institutionWebsite}
                  institutionSeal={institutionSeal}
                  headName={headName}
                  validityDate={validityDate}
                  fatherName={user?.email}
                  admissionNumber={institution?.name}
                  registrationNumber={institution?._id}
                />
              )}
              {selectedTemplate === 'staff' && (
                <ProfessionalIDCard
                  name={liveIdentity}
                  idNumber={liveIdNumber || liveIdentity}
                  role="staff"
                  photoUrl={livePhotoUrl}
                  institutionName={institutionName}
                  institutionLogo={institutionLogo}
                  institutionAddress={institutionAddress}
                  institutionPhone={institutionPhone}
                  institutionEmail={institutionEmail}
                  institutionWebsite={institutionWebsite}
                  institutionSeal={institutionSeal}
                  headName={headName}
                  validityDate={validityDate}
                />
              )}
              {selectedTemplate === 'admit' && (
                <AdmitCard
                  name={liveIdentity}
                  rollNumber={liveIdNumber || liveIdentity}
                  photoUrl={livePhotoUrl}
                  institutionName={institutionName}
                  institutionLogo={institutionLogo}
                  institutionAddress={institutionAddress}
                  institutionPhone={institutionPhone}
                  institutionEmail={institutionEmail}
                  institutionSeal={institutionSeal}
                  examName={examLabel}
                  examDate={validityDate}
                  examCenter={institutionName}
                  centerCode={institution?._id}
                  headName={headName}
                  dateOfBirth={user?.lastLogin || undefined}
                  fatherName={user?.email}
                  stream={user?.role ? user.role.replace(/_/g, ' ') : institutionName}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">✨ Professional Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Layered gradients, refined spacing, and stronger typography make the cards feel closer to printed ID
              images instead of plain form output.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">🔲 QR Code Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every card now carries a QR payload with identity and exam metadata for faster verification and cleaner
              digital handoff.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">📋 Complete Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground\">
              All required fields including photo, institutional branding, validity dates, head signature, official
              seal, and class or stream details where relevant.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
