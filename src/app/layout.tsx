import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sentient Judges',
  description: 'Pledge to Sentient and discover your worthiness.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
