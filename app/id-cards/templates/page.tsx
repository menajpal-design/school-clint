'use client'

import { useState } from 'react'
import { Layers, Download, Eye } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfessionalIDCard } from '@/components/id-cards/ProfessionalIDCard'
import { AdmitCard } from '@/components/id-cards/AdmitCard'

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

const sampleData = {
  name: 'Arjun Kumar Singh',
  idNumber: 'STU-2024-001',
  photoUrl: 'https://via.placeholder.com/100x120?text=Photo',
  institutionName: 'Modern Public School',
  institutionLogo: 'https://via.placeholder.com/50x50?text=Logo',
  validityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  headName: 'Dr. Ramesh Sharma',
  dateOfBirth: '2008-05-15',
  fatherName: 'Mr. Rajesh Kumar Singh',
  admissionNumber: 'ADM/2023/1001',
  registrationNumber: 'REG/2023/001',
  stream: 'Science (PCM)',
  rollNumber: 'A-101',
  examName: 'Annual Examination 2024',
  examDate: '2024-02-15',
  examCenter: 'School Campus, Hall A',
  centerCode: 'CENTER-001',
}

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('student')
  const [previewMode, setPreviewMode] = useState<'grid' | 'full'>('grid')

  const currentTemplate = cardTemplates.find((t) => t.id === selectedTemplate)

  return (
    <div className="space-y-6">
      <PageHeader
        title="ID Card Templates"
        description="Professional card templates with QR code integration. Preview and customize for your institution."
        icon={Layers}
        status={<Badge variant="outline">Professional Templates</Badge>}
      />

      {/* Template Selection */}
      <section className="grid gap-3 md:grid-cols-4">
        {cardTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-slate-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-xs">{template.description}</CardDescription>
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
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle>{currentTemplate?.name} Preview</CardTitle>
          <CardDescription>
            This template includes all required information, institutional branding, and integrated QR code for
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`flex ${previewMode === 'full' ? 'justify-center' : 'overflow-x-auto'}`}
          >
            <div className={previewMode === 'full' ? '' : 'min-w-max pr-4'}>
              {selectedTemplate === 'student' && (
                <ProfessionalIDCard
                  name={sampleData.name}
                  idNumber={sampleData.idNumber}
                  role="student"
                  photoUrl={sampleData.photoUrl}
                  institutionName={sampleData.institutionName}
                  institutionLogo={sampleData.institutionLogo}
                  validityDate={sampleData.validityDate}
                  headName={sampleData.headName}
                  dateOfBirth={sampleData.dateOfBirth}
                  fatherName={sampleData.fatherName}
                  admissionNumber={sampleData.admissionNumber}
                  registrationNumber={sampleData.registrationNumber}
                />
              )}
              {selectedTemplate === 'teacher' && (
                <ProfessionalIDCard
                  name="Dr. Arun Kumar Verma"
                  idNumber="FAC-2024-042"
                  role="teacher"
                  photoUrl={sampleData.photoUrl}
                  institutionName={sampleData.institutionName}
                  institutionLogo={sampleData.institutionLogo}
                  validityDate={sampleData.validityDate}
                  headName={sampleData.headName}
                  fatherName="Mr. Vikram Verma"
                  admissionNumber="DEPT/SCIENCE/001"
                  registrationNumber="REG/FACULTY/042"
                />
              )}
              {selectedTemplate === 'staff' && (
                <ProfessionalIDCard
                  name="Ms. Sharma"
                  idNumber="STAFF-2024-015"
                  role="staff"
                  photoUrl={sampleData.photoUrl}
                  institutionName={sampleData.institutionName}
                  institutionLogo={sampleData.institutionLogo}
                  validityDate={sampleData.validityDate}
                  headName={sampleData.headName}
                />
              )}
              {selectedTemplate === 'admit' && (
                <AdmitCard
                  name={sampleData.name}
                  rollNumber={sampleData.rollNumber}
                  photoUrl={sampleData.photoUrl}
                  institutionName={sampleData.institutionName}
                  institutionLogo={sampleData.institutionLogo}
                  examName={sampleData.examName}
                  examDate={sampleData.examDate}
                  examCenter={sampleData.examCenter}
                  centerCode={sampleData.centerCode}
                  headName={sampleData.headName}
                  dateOfBirth={sampleData.dateOfBirth}
                  fatherName={sampleData.fatherName}
                  stream={sampleData.stream}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">✨ Professional Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Modern gradient backgrounds with role-specific colors. Clean typography and professional layout suitable
              for institutional use.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🔲 QR Code Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Every card includes an integrated QR code containing student/staff details for secure verification and
              digital access.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 Complete Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              All required fields including photo, institutional branding, validity dates, head signature, and official
              seal.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
