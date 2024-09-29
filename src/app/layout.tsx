import type { Metadata } from 'next';
import { Montserrat, Poppins } from 'next/font/google';
import './globals.css';
import { twMerge } from 'tailwind-merge';
import { createClient, repositoryName } from '@/prismicio';
import Header from './components/Header';
import Footer from './components/Footer';
import { PrismicPreview } from '@prismicio/next';

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
    <html lang="pt-BR" className={twMerge(montserrat.variable, poppins.variable)}>
      <head>
        <link rel="icon" href="/logo.svg" sizes="any" />
      </head>
      <body className="flex flex-col min-h-[100vh]">
        <div id="app" className='flex flex-col flex-grow'>
        <Header />
        {children}
        <Footer />
        <div className="fixed bg-[#F1F1F1] z-[-1] inset-0"></div>
        <PrismicPreview repositoryName={repositoryName} />
        </div>
      </body>
    </html>
  );
}
