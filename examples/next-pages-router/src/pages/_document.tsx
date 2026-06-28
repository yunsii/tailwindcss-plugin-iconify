import { createIconcatDocumentHead } from '@iconcat/next/pages-router'
import Document, {
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'

const IconcatHead = createIconcatDocumentHead(Head)

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
