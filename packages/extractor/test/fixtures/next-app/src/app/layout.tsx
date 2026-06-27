export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <span className='icon-[mdi-light--home]' />
        {children}
      </body>
    </html>
  )
}
