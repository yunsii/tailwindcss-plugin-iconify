import { createIconcatDocumentHead } from '@iconcat/next/pages-router'
import Document, {
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'

import { iconcatManifest } from '../page-static-props'

const IconcatHead = createIconcatDocumentHead(Head, { manifest: iconcatManifest })

export default class AppDocument extends Document {
  render() {
    return (
      <Html>
        <IconcatHead />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
