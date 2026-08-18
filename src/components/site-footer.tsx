import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo.png.asset.json";

type FooterLink = {
  label: string;
  to?: string;
};

const LINKS: FooterLink[] = [
  { label: "Termos de uso", to: "/termos" },
  { label: "Política de Privacidade", to: "/politica" },
  { label: "Suporte" },
  { label: "Contato" },
];

export function SiteFooter() {
  return (
    <footer className="pb-8 pt-10 text-center">
      <img
        src={logoAsset.url}
        alt="Em Alta no Mundo"
        className="mx-auto h-auto w-full max-w-[420px]"
        loading="lazy"
      />

      <ul className="mx-auto mt-10 max-w-[760px] space-y-6 text-left text-[16px]">
        {LINKS.map((link) => (
          <li key={link.label}>
            {link.to ? (
              <Link to={link.to} className="hover:text-brand">
                {link.label}
              </Link>
            ) : (
              <a href="#" className="hover:text-brand">
                {link.label}
              </a>
            )}
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
