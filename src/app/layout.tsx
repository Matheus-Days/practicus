import type { Metadata } from 'next';
import { Montserrat, Poppins } from 'next/font/google';
import './globals.css';
import clsx from 'clsx';
import { createClient } from '@/prismicio';
import Header from './components/Header';
import Footer from './components/Footer';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-poppins',
  display: 'swap'
});

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();

  const page = await client.getSingle('configuracoes');

  return {
    title: page.data.nome_do_website || 'Practicus',
    description:
      page.data.metadescricao ||
      'Treinamentos, cursos e capacitações em licitações públicas.',
    openGraph: {
      images: [page.data.imagem_og.url || '']
    }
  };
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={clsx(montserrat.variable, poppins.variable)}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
