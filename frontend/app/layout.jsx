import './globals.css'
import { Inter, JetBrains_Mono, Bangers } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const bangers = Bangers({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bangers',
  display: 'swap',
})

export const metadata = {
  title: 'AI Director',
  description: 'Turn scene descriptions into cinematic storyboards',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${bangers.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
