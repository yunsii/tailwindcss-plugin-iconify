import { getNextIconcatCSSHref } from '@iconcat/next'

import type { GetStaticProps } from 'next'

export interface IconcatPageProps {
  iconcatCSSHref: string | null
}

export function createIconcatStaticProps(): GetStaticProps<IconcatPageProps> {
  return () => ({
    props: {
      iconcatCSSHref: getNextIconcatCSSHref() || null,
    },
  })
}
