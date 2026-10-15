import type { Metadata, Viewport } from 'next'
import { Roboto_Condensed, Roboto_Flex } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const robotoFlex = Roboto_Flex({ subsets: ['latin'], variable: '--font-roboto-flex', display: 'swap' })
const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-roboto-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sirius UNIMET | Inscripciones',
  description: 'Portal de inscripciones para estudiantes de la Universidad Metropolitana.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#050d22' },
  ],
}

// Applies the stored theme before first paint to avoid a flash of the wrong theme.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${robotoFlex.variable} ${robotoCondensed.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
