import GNB from '../components/GNB';
import '../styles/atom-one-dark.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/component.css';
import '../styles/theme.css';
import '../styles/style.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <GNB />
        {children}
      </body>
    </html>
  )
}