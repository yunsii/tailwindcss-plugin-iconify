import './styles.css'

export const metadata = {
  title: 'Iconcat',
  description: 'Entry-driven icon catalog extractor.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  )
}
