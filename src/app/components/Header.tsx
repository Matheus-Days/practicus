import { createClient } from '@/prismicio';
import { PrismicNextImage, PrismicNextLink } from '@prismicio/next';
import Link from 'next/link';

export default async function Header() {
  const client = createClient();

  const page = await client.getSingle('configuracoes');

  return (
    <header className="hidden md:flex justify-between items-center py-2 px-6">
      <Link href="/"><PrismicNextImage field={page.data.logo} /></Link>
      
      <nav className="font-display">
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
