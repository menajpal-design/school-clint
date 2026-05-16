import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/hooks/useToast'
import { LanguageProvider } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export const metadata: Metadata = {
  title: 'EASY SCHOOL - School Management System',
  description: 'Complete School/Madrasah Management System',
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
            <LanguageSwitcher />
            {children}
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
