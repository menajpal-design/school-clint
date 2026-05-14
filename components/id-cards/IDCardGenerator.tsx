'use client'

import React, { useState } from 'react'
import { Edit, Download, Printer } from 'lucide-react'
import StudentCard from './StudentIDCard'
import TeacherCard from './TeacherIDCard'
import AdmitCard from './AdmitCard'
import { TeacherModal, StudentModal, AdmitModal, TeacherData, StudentData, AdmitData } from './EditModals'

const IDCardGenerator = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admit'>('student')

  // Sample data
  const [studentData, setStudentData] = useState<StudentData>({
    name: 'John Doe',
    id: 'STU2024001',
    session: '2024-2025',
    phone: '+880 1234 567890',
    email: 'john.doe@university.edu',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    institutionAddress: 'South Plaza, Academic Block, Dhaka',
    institutionWebsite: 'www.yourcampus.edu',
    institutionPhone: '+880 1234 567891',
    institutionEmail: 'info@university.edu',
    instructions: [
      'Card must be presented on demand.',
      'Loss must be reported to the registrar.',
      'Misuse is a punishable offense.',
      'Keep card safe and secure.'
    ],
  })

  const [teacherData, setTeacherData] = useState<TeacherData>({
    name: 'Dr. Sarah Johnson',
    id: 'TCH2024001',
    designation: 'Associate Professor',
    department: 'Computer Science',
    phone: '+880 1234 567891',
    email: 'sarah.johnson@university.edu',
    photoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    institutionAddress: 'South Plaza, Academic Block, Dhaka',
    institutionWebsite: 'www.yourcampus.edu',
    institutionPhone: '+880 1234 567891',
    institutionEmail: 'info@university.edu',
    instructions: [
      'Card must be presented on demand.',
      'Loss must be reported to the registrar.',
      'Misuse is a punishable offense.',
      'Keep card safe and secure.'
    ],
  })

  const [admitData, setAdmitData] = useState<AdmitData>({
    name: 'John Doe',
    id: 'STU2024001',
    session: '2024-2025',
    class: 'BSc Computer Science',
    roll: 'CS001',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    examData: [
      { subject: 'Mathematics', date: '15 Dec 2024', time: '10:00 AM - 12:00 PM' },
      { subject: 'Physics', date: '16 Dec 2024', time: '10:00 AM - 12:00 PM' },
      { subject: 'Chemistry', date: '17 Dec 2024', time: '10:00 AM - 12:00 PM' },
      { subject: 'English', date: '18 Dec 2024', time: '10:00 AM - 12:00 PM' }
    ]
  })

  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [showAdmitModal, setShowAdmitModal] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // This would typically use html2canvas or similar library
    alert('Download functionality would be implemented with html2canvas/PDF generation')
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#1E73BE] text-white p-6">
            <h1 className="text-3xl font-black text-center">ID Card Generator</h1>
            <p className="text-center opacity-90 mt-2">Generate professional ID cards for students, teachers, and admit cards</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {[
              { key: 'student', label: 'Student ID Card' },
              { key: 'teacher', label: 'Teacher ID Card' },
              { key: 'admit', label: 'Admit Card' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#1E73BE] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => {
                  if (activeTab === 'student') setShowStudentModal(true)
                  else if (activeTab === 'teacher') setShowTeacherModal(true)
                  else setShowAdmitModal(true)
                }}
                className="flex items-center space-x-2 bg-[#1E73BE] text-white px-6 py-3 rounded-lg hover:bg-[#155a8a] transition-colors"
              >
                <Edit size={20} />
                <span>Edit Information</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                <span>Download</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer size={20} />
                <span>Print</span>
              </button>
            </div>

            {/* Card Display */}
            <div className="flex justify-center">
              {activeTab === 'student' && <StudentCard {...studentData} />}
              {activeTab === 'teacher' && <TeacherCard {...teacherData} />}
              {activeTab === 'admit' && <AdmitCard {...admitData} />}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        data={studentData}
        onSave={setStudentData}
      />
      <TeacherModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        data={teacherData}
        onSave={setTeacherData}
      />
      <AdmitModal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        data={admitData}
        onSave={setAdmitData}
      />
    </div>
  )
}

export default IDCardGenerator