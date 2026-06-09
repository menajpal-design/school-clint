import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import './mobile-comfort.css'
import { ToastProvider } from '@/hooks/useToast'
import { LanguageProvider } from '@/lib/i18n'
import { MobileTableEnhancer } from '@/components/layout/MobileTableEnhancer'
import { ImageUploadGuard } from '@/components/layout/ImageUploadGuard'
import { RootAppShell } from '@/components/layout/RootAppShell'
import { AttendanceApiCompatLoader } from '@/components/layout/AttendanceApiCompatLoader'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EASY SCHOOL - School Management System',
  description: 'Complete School/Madrasah Management System',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} min-h-screen bg-background font-sans`}>
        <LanguageProvider>
          <ToastProvider>
            <AttendanceApiCompatLoader />
            <MobileTableEnhancer />
            <ImageUploadGuard />
            <RootAppShell>{children}</RootAppShell>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
