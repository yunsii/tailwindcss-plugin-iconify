import type { OriginProps } from 'next/document'
import type React from 'react'

declare module '*.css'

declare module 'next/document' {
  interface Head extends React.Component<OriginProps> {}
  interface NextScript extends React.Component<OriginProps> {}
}
