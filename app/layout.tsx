import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/hooks/useToast'
import { LanguageProvider } from '@/lib/i18n'
import { MobileTableEnhancer } from '@/components/layout/MobileTableEnhancer'
import { ImageUploadGuard } from '@/components/layout/ImageUploadGuard'
import { RootAppShell } from '@/components/layout/RootAppShell'

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
      <body className="min-h-screen bg-background">
        <LanguageProvider>
          <ToastProvider>
            <MobileTableEnhancer />
            <ImageUploadGuard />
            <RootAppShell>{children}</RootAppShell>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}