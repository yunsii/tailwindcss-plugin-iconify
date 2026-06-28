export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <span aria-hidden='true' className='icon-[mdi-light--folder]' />
      {children}
    </section>
  )
}
