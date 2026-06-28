import Head from 'next/head'

import type { IconcatCSSManifestFile } from '@iconcat/next'

export function IconcatPageStylesheet({ files }: { files: IconcatCSSManifestFile[] }) {
  const preloadFiles = files.filter((file) => file.priority)

  return files.length
    ? (
        <Head>
          {preloadFiles.map((file) => (
            <link as='style' href={file.href} key={`preload:${file.href}`} rel='preload' />
          ))}
          {files.map((file) => (
            <link href={file.href} key={file.href} rel='stylesheet' />
          ))}
        </Head>
      )
    : null
}
