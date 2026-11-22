import type { Metadata } from 'next';
import '../styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Iris Hair Cut and Salon | Luxury Hair & Beauty Care',
  description: 'Premier hair salon offering precision haircuts, styling, coloring, facials, and luxury spa treatments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col font-sans bg-white text-zinc-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
