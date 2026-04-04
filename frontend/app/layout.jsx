import './globals.css'

export const metadata = {
  title: 'AI Director',
  description: 'Turn scene descriptions into cinematic storyboards',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
