import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Pacifico, Playpen_Sans } from 'next/font/google'
import './globals.css'

const vietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-vietnam',
  display: 'swap',
})

const pacifico = Pacifico({
  subsets: ['vietnamese', 'latin'],
  weight: '400',
  variable: '--font-pacifico',
  display: 'swap',
})

const playpen = Playpen_Sans({
  subsets: ['vietnamese', 'latin'],
  variable: '--font-playpen',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Thương — Những ngày của chúng mình',
  description: 'Một góc nhỏ để cất giữ những điều thật đẹp của hai đứa.',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#FFF6F9',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${vietnam.variable} ${pacifico.variable} ${playpen.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
