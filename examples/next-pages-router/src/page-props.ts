import type { GetStaticProps } from 'next'

import { getIconcatCSSHref } from './iconcat-manifest'

export interface IconcatPageProps {
  iconcatCSSHref: string | null
}

export const getIconcatStaticProps: GetStaticProps<IconcatPageProps> = () => ({
  props: {
    iconcatCSSHref: getIconcatCSSHref() || null,
  },
})
