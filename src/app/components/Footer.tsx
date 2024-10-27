import { ReactNode } from 'react';

type ExtLinkProps = {
  href: string;
  children: ReactNode;
};

function ExtLink({ children, href }: ExtLinkProps) {
  return (
    <a href={href} target='_blank' className="font-medium cursor-pointer">
      {children}
    </a>
  );
}
export default function Footer() {
  return (
    <footer className="font-display mt-6 border-t border-accent py-[0.375rem] md:py-3 px-[1.375rem] text-primary text-center">
      <p className="text-xs md:text-[0.8125rem] md:leading-[1.1875rem]">
        © Todos os direitos reservados.
      </p>
      <p className="text-[0.5625rem] md:text-[0.8125rem] leading-[0.6875rem] md:leading-[1.1875rem]">
        Design por:{' '}
        <ExtLink href="https://www.linkedin.com/in/carina-torquato-174467229/">
          Carina Torquato
        </ExtLink>{' '}
        | Desenvolvido por:{' '}
        <ExtLink href="https://www.linkedin.com/in/matheus-braga-dias-6129a31b0/">
          Matheus Braga
        </ExtLink>
      </p>
    </footer>
  );
}
