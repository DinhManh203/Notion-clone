import type { Metadata } from 'next'
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google'
import { ThemeProvider } from '../components/providers/theme-provider'
import { ConvexClientProvider } from '@/components/providers/convex-provider'
import { ModalProvider } from '@/components/providers/modal-provider';
import { EdgeStoreProvider } from '@/lib/edgestore';
import ClickSparkWrapper from "./(main)/_components/ClickSparkWrapper";

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'MiNote',
  description: 'Note everything you like',
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/Logo.svg",
        href: "/Logo.svg",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/Logo.svg",
        href: "/Logo.svg",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <EdgeStoreProvider>
            <ClickSparkWrapper>
            <ThemeProvider attribute="class" defaultTheme='system' enableSystem disableTransitionOnChange storageKey='notion-theme-2'>
              <Toaster position="top-center" />
              <ModalProvider />
              {children}
            </ThemeProvider>
          </ClickSparkWrapper>
        </EdgeStoreProvider>
      </ConvexClientProvider>
    </body>
    </html >
  )
}