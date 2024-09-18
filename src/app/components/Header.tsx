import { createClient } from '@/prismicio';
import { PrismicNextImage, PrismicNextLink } from '@prismicio/next';
import Link from 'next/link';
import MobileNav from './MobileNav';

export default async function Header() {
  const client = createClient();

  const page = await client.getSingle('configuracoes');

  return (
    <header className="flex justify-between items-center py-2 px-6 relative border-b border-accent">
      <Link href="/"><PrismicNextImage field={page.data.logo} /></Link>
      
      <MobileNav navegacao={page.data.navegacao} />

      <nav className="font-display hidden md:block">
        <ul className="flex gap-6">
          {page.data.navegacao.map(({ link, rotulo }) => (
            <li key={rotulo}>
              <PrismicNextLink field={link}>{rotulo}</PrismicNextLink>
            </li>
          ))}
        </ul>
      </nav>

    </header>
  );
}
