# Professional ID Cards & Admit Cards

## Overview

The ID Card system now includes professional, modern card templates with integrated QR code support for secure verification. All text is in English, featuring institutional branding and comprehensive student/staff information.

## Components

### 1. ProfessionalIDCard

Professional ID card component for Students, Teachers, and Staff with role-specific styling.

**Props:**
```typescript
interface ProfessionalIDCardProps {
  name: string                    // Full name of the person
  idNumber: string               // Unique ID/Roll number
  role: 'student' | 'teacher' | 'staff'  // Card type
  className?: string             // Additional CSS classes
  photoUrl?: string              // Profile photo URL
  institutionName?: string       // School/College name
  institutionLogo?: string       // Logo image URL
  validityDate?: string          // Card valid until date
  headName?: string              // Principal/Head name
  dateOfBirth?: string           // Date of birth (YYYY-MM-DD)
  fatherName?: string            // Father's name
  motherName?: string            // Mother's name
  admissionNumber?: string       // Admission ID
  registrationNumber?: string    // Registration ID
}
```

**Features:**
- ✨ Role-specific gradient backgrounds (Blue for Student, Green for Teacher, Purple for Staff)
- 🔲 Embedded QR code with student details
- 📸 Professional photo frame with border
- 📋 Complete institutional information
- 🖋️ Head signature and seal area
- 🎨 Responsive design with Tailwind CSS
- 📱 Print-friendly layout

**Usage:**
```tsx
import { ProfessionalIDCard } from '@/components/id-cards'

export default function StudentCard() {
  return (
    <ProfessionalIDCard
      name="Arjun Kumar Singh"
      idNumber="STU-2024-001"
      role="student"
      photoUrl="/student-photo.jpg"
      institutionName="Modern Public School"
      institutionLogo="/school-logo.png"
      validityDate="2025-12-31"
      headName="Dr. Ramesh Sharma"
      dateOfBirth="2008-05-15"
      fatherName="Mr. Rajesh Kumar Singh"
      admissionNumber="ADM/2023/1001"
      registrationNumber="REG/2023/001"
    />
  )
}
```

### 2. AdmitCard

Professional exam admit card with examination details and QR code verification.

**Props:**
```typescript
interface AdmitCardProps {
  name: string                   // Student name
  rollNumber: string             // Roll/Admission number
  className?: string             // Additional CSS classes
  photoUrl?: string              // Student photo URL
  institutionName?: string       // School/College name
  institutionLogo?: string       // Logo image URL
  examName?: string              // Examination name
  examDate?: string              // Exam date (YYYY-MM-DD)
  examCenter?: string            // Exam center location
  centerCode?: string            // Center code
  headName?: string              // Principal/Head name
  dateOfBirth?: string           // Date of birth
  fatherName?: string            // Father's name
  stream?: string                // Class/Stream/Subject
}
```

**Features:**
- 🎓 Exam-specific information display
- 🟢 Green header band with institutional branding
- 📍 Exam center and center code
- ⚠️ Important instructions section
- 🔲 QR code for exam verification
- 📅 Automatic issue date
- 🖋️ Head authorization area
- 🎨 Professional amber/gold background with green accents

**Usage:**
```tsx
import { AdmitCard } from '@/components/id-cards'

export default function ExamAdmitCard() {
  return (
    <AdmitCard
      name="Arjun Kumar Singh"
      rollNumber="A-101"
      photoUrl="/student-photo.jpg"
      institutionName="Modern Public School"
      examName="Annual Examination 2024"
      examDate="2024-02-15"
      examCenter="School Campus, Hall A"
      centerCode="CENTER-001"
      headName="Dr. Ramesh Sharma"
      dateOfBirth="2008-05-15"
      fatherName="Mr. Rajesh Kumar Singh"
      stream="Science (PCM)"
    />
  )
}
```

## Features

### QR Code Integration
Each card includes an automatically generated QR code containing:
- Student/Staff name
- ID number
- Role/Card type
- Institution name
- Validity date

QR codes are generated using `qrcode.react` library with high resolution for easy scanning.

### Role-Specific Styling
Each role has distinct visual identity:

**Student ID Card**
- Blue gradient background (from-blue-600 to-blue-800)
- Educational focus
- Academic information fields

**Faculty/Teacher ID Card**
- Green gradient background (from-green-600 to-green-800)
- Department information
- Academic credentials

**Staff ID Card**
- Purple gradient background (from-purple-600 to-purple-800)
- Administrative focus
- Department designation

**Admit Card**
- Amber/Gold background with green header
- Exam-specific information
- Important instructions for students

## Usage in Pages

### Generate ID Card Page
Located at `/id-cards/generate` - Complete form to create custom ID cards with preview and download options.

### Templates Page
Located at `/id-cards/templates` - View and select from predefined templates with customization options.

### My Card Page
Located at `/id-cards/my-card` - View your own issued ID card.

## Styling & Customization

All components use Tailwind CSS for styling and are fully customizable through:
1. Props for content and data
2. className prop for additional styling
3. Direct component modification for design changes

## Accessibility

- Semantic HTML structure
- Readable color contrasts
- Clear typography hierarchy
- Support for screen readers through proper labeling

## Performance

- SVG-based QR codes (lightweight)
- Optimized image handling
- Responsive design for all screen sizes
- Print-optimized layouts

## File Locations

- `client/components/id-cards/ProfessionalIDCard.tsx` - Main ID card component
- `client/components/id-cards/AdmitCard.tsx` - Admit card component
- `client/components/id-cards/GenerateIDCardForm.tsx` - Card generation form
- `client/app/id-cards/templates/page.tsx` - Template showcase
- `client/app/id-cards/generate/page.tsx` - Card generation page

## Dependencies

- `qrcode.react` - QR code generation
- `react` - UI framework
- `next/image` - Image optimization
- Tailwind CSS - Styling

## Future Enhancements

- [ ] Batch card generation
- [ ] Card design customization interface
- [ ] Database integration for student data
- [ ] Print batch operations
- [ ] Card validity management
- [ ] Digital card distribution
- [ ] Card revocation system
