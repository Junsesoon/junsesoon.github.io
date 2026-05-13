import GNB from '../components/GNB';

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