import Link from 'next/link'

import type { RouteLinkRenderer } from '@iconcat/example-fixtures/dashboard'

export const renderRouteLink: RouteLinkRenderer = ({ href, label }) => (
  <Link href={href}>{label}</Link>
)
