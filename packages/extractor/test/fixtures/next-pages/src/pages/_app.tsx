export default function App({ Component, pageProps }: any) {
  return (
    <>
      <span className='icon-[mdi-light--home]' />
      <Component {...pageProps} />
    </>
  )
}
