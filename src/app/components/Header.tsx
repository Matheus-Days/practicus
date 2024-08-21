import { createClient } from '@/prismicio';
import { PrismicNextLink } from '@prismicio/next';
import Link from 'next/link';

export default async function Header() {
  const client = createClient();

  const page = await client.getSingle('configuracoes');

  return (
    <header>
      <Link href="/">{page.data.nome_do_website}</Link>
      
      <nav>
        <ul>
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
