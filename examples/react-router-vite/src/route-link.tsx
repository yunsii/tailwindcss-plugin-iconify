import { Link } from 'react-router-dom'

import type { RouteLinkRenderer } from '@iconcat/example-fixtures/dashboard'

export const renderRouteLink: RouteLinkRenderer = ({ href, label }) => (
  <Link to={href}>{label}</Link>
)
