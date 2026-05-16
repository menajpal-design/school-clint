'use client'

import React, { useState } from 'react'
import { X, Edit, Save } from 'lucide-react'

export interface TeacherData {
  name: string
  id: string
  designation: string
  department: string
  phone: string
  email: string
  photoUrl: string
  institutionAddress?: string
  institutionWebsite?: string
  institutionPhone?: string
  institutionEmail?: string
  instructions?: string[]
}

export interface StudentData {
  name: string
  id: string
  session: string
  phone: string
  email: string
  photoUrl: string
  institutionAddress?: string
  institutionWebsite?: string
  institutionPhone?: string
  institutionEmail?: string
  instructions?: string[]
}

export interface AdmitData {
  name: string
  id: string
  session: string
  class: string
  roll: string
  photoUrl: string
  examData: {
    subject: string
    date: string
    time: string
  }[]
}

interface EditModalProps<T> {
  isOpen: boolean
  onClose: () => void
  data: T
  onSave: (data: T) => void
  title: string
  children: (data: T, onChange: (field: keyof T, value: any) => void) => React.ReactNode
}

function EditModal<T>({ isOpen, onClose, data, onSave, title, children }: EditModalProps<T>) {
  const [editedData, setEditedData] = useState<T>(data)

  const handleChange = (field: keyof T, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(editedData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#1E73BE] text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children(editedData, handleChange)}
        </div>
        <div className="bg-gray-50 p-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#1E73BE] text-white rounded-lg hover:bg-[#155a8a] transition-colors flex items-center space-x-2"
          >
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function TeacherModal({ isOpen, onClose, data, onSave }: {
  isOpen: boolean
  onClose: () => void
  data: TeacherData
  onSave: (data: TeacherData) => void
}) {
  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      data={data}
      onSave={onSave}
      title="Edit Teacher Information"
    >
      {(data, onChange) => (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID</label>
              <input
                type="text"
                value={data.id}
                onChange={(e) => onChange('id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
              <input
                type="text"
                value={data.designation}
                onChange={(e) => onChange('designation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={data.department}
                onChange={(e) => onChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                value={data.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => onChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Address</label>
              <input
                type="text"
                value={data.institutionAddress || ''}
                onChange={(e) => onChange('institutionAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Website</label>
              <input
                type="text"
                value={data.institutionWebsite || ''}
                onChange={(e) => onChange('institutionWebsite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Phone</label>
              <input
                type="text"
                value={data.institutionPhone || ''}
                onChange={(e) => onChange('institutionPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Email</label>
              <input
                type="email"
                value={data.institutionEmail || ''}
                onChange={(e) => onChange('institutionEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions (one per line)</label>
            <textarea
              value={data.instructions ? data.instructions.join('\n') : ''}
              onChange={(e) => onChange('instructions', e.target.value.split('\n').filter(line => line.trim()))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              placeholder="Enter instructions, one per line"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photo URL</label>
            <input
              type="url"
              value={data.photoUrl}
              onChange={(e) => onChange('photoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
            />
          </div>
        </div>
      )}
    </EditModal>
  )
}

export function StudentModal({ isOpen, onClose, data, onSave }: {
  isOpen: boolean
  onClose: () => void
  data: StudentData
  onSave: (data: StudentData) => void
}) {
  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      data={data}
      onSave={onSave}
      title="Edit Student Information"
    >
      {(data, onChange) => (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID</label>
              <input
                type="text"
                value={data.id}
                onChange={(e) => onChange('id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Session</label>
              <input
                type="text"
                value={data.session}
                onChange={(e) => onChange('session', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                value={data.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => onChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Photo URL</label>
              <input
                type="url"
                value={data.photoUrl}
                onChange={(e) => onChange('photoUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Address</label>
              <input
                type="text"
                value={data.institutionAddress || ''}
                onChange={(e) => onChange('institutionAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Website</label>
              <input
                type="text"
                value={data.institutionWebsite || ''}
                onChange={(e) => onChange('institutionWebsite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Phone</label>
              <input
                type="text"
                value={data.institutionPhone || ''}
                onChange={(e) => onChange('institutionPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Email</label>
              <input
                type="email"
                value={data.institutionEmail || ''}
                onChange={(e) => onChange('institutionEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions (one per line)</label>
            <textarea
              value={data.instructions ? data.instructions.join('\n') : ''}
              onChange={(e) => onChange('instructions', e.target.value.split('\n').filter(line => line.trim()))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              placeholder="Enter instructions, one per line"
            />
          </div>
        </div>
      )}
    </EditModal>
  )
}

export function AdmitModal({ isOpen, onClose, data, onSave }: {
  isOpen: boolean
  onClose: () => void
  data: AdmitData
  onSave: (data: AdmitData) => void
}) {
  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      data={data}
      onSave={onSave}
      title="Edit Admit Card Information"
    >
      {(data, onChange) => (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID</label>
              <input
                type="text"
                value={data.id}
                onChange={(e) => onChange('id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Session</label>
              <input
                type="text"
                value={data.session}
                onChange={(e) => onChange('session', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
              <input
                type="text"
                value={data.class}
                onChange={(e) => onChange('class', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Roll</label>
              <input
                type="text"
                value={data.roll}
                onChange={(e) => onChange('roll', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photo URL</label>
            <input
              type="url"
              value={data.photoUrl}
              onChange={(e) => onChange('photoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E73BE] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Schedule</label>
            <div className="space-y-2">
              {data.examData.map((exam, index) => (
                <div key={index} className="grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={exam.subject}
                    onChange={(e) => {
                      const newExamData = [...data.examData]
                      newExamData[index].subject = e.target.value
                      onChange('examData', newExamData)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Date"
                    value={exam.date}
                    onChange={(e) => {
                      const newExamData = [...data.examData]
                      newExamData[index].date = e.target.value
                      onChange('examData', newExamData)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Time"
                    value={exam.time}
                    onChange={(e) => {
                      const newExamData = [...data.examData]
                      newExamData[index].time = e.target.value
                      onChange('examData', newExamData)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </EditModal>
  )
}
