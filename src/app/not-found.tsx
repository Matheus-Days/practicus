import BoundedMain from './components/BoundedMain';

export default function NotFound() {
  return (
    <BoundedMain className="font-display font-medium flex flex-col justify-center items-center gap-3">
      <h1 className="text-2xl">Página não encontrada.</h1>
      <p className="text-xl">
        Endereço incorreto ou a página que você procurava não está mais
        disponível.
      </p>
    </BoundedMain>
  );
}
