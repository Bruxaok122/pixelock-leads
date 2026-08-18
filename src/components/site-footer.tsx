const LINKS = ["Termos de uso", "Política de Privacidade", "Suporte", "Contato"];

export function SiteFooter() {
  return (
    <footer className="pb-8 pt-10 text-center">
      <p className="text-[26px] font-bold uppercase leading-none tracking-tight">
        <span className="text-[14px] align-middle">Em </span>Alta
        <br />
        <span className="text-[14px] align-middle">No </span>Mundo
      </p>

      <ul className="mx-auto mt-10 max-w-[760px] space-y-6 text-left text-[16px]">
        {LINKS.map((link) => (
          <li key={link}>
            <a href="#" className="hover:text-brand">
              {link}
            </a>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-[760px] border-t border-border pt-6 text-[14px] leading-relaxed text-muted-foreground">
        <p>© 2026 Em Alta no Mundo.</p>
        <p>Todos os direitos reservados.</p>
        <p>CNPJ: 38.235.159/0001-68</p>
      </div>
    </footer>
  );
}
