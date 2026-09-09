import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Em Alta no Mundo | Conteúdo sobre educação financeira" },
      {
        name: "description",
        content:
          "Portal de conteúdo informativo sobre educação financeira, organização do orçamento e uso consciente do dinheiro no dia a dia.",
      },
      { property: "og:title", content: "Em Alta no Mundo | Conteúdo sobre educação financeira" },
      {
        property: "og:description",
        content:
          "Artigos e materiais informativos sobre planejamento financeiro pessoal, hábitos de consumo e organização do orçamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const ARTICLES = [
  {
    tag: "Organização",
    title: "Como montar um orçamento mensal simples",
    text: "Um método direto para registrar receitas, despesas fixas e variáveis, e enxergar para onde o seu dinheiro está indo todos os meses.",
  },
  {
    tag: "Hábitos",
    title: "Pequenos gastos que pesam no fim do mês",
    text: "Entenda como despesas recorrentes de baixo valor se acumulam e quais critérios usar para revisar assinaturas e serviços.",
  },
  {
    tag: "Planejamento",
    title: "Reserva de emergência: por onde começar",
    text: "O que considerar ao definir um valor de segurança compatível com a sua realidade e com os seus custos essenciais.",
  },
  {
    tag: "Consumo",
    title: "Comparar preços antes de decidir",
    text: "Critérios objetivos para avaliar uma compra, evitar decisões por impulso e comparar condições de pagamento com clareza.",
  },
];

function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-[900px] px-4 pb-14 pt-12">
        <header className="text-center">
          <small className="block text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-soft">
            Conteúdo informativo
          </small>
          <h1 className="mt-3 text-[clamp(26px,5vw,40px)] font-bold leading-tight tracking-tight">
            Em Alta no Mundo
          </h1>
          <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
            Reunimos materiais informativos sobre educação financeira, organização do orçamento pessoal e consumo
            consciente. Nosso objetivo é apresentar informação clara, sem promessas de ganhos e sem oferta de
            investimentos.
          </p>
        </header>

        <section aria-label="Artigos" className="mt-10 grid gap-3.5 sm:grid-cols-2">
          {ARTICLES.map((article) => (
            <article key={article.title} className="surface-card rounded-2xl p-5">
              <span className="text-[10px] font-extrabold uppercase text-brand-soft">{article.tag}</span>
              <h2 className="my-2 text-[17px] font-bold leading-tight">{article.title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{article.text}</p>
              <div className="mt-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
                Conteúdo educativo
              </div>
            </article>
          ))}
        </section>

        <section aria-label="Sobre" className="surface-card mt-8 rounded-2xl p-6">
          <h2 className="text-xl font-bold tracking-tight">Sobre o site</h2>
          <div className="mt-3 grid gap-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Este site publica conteúdo de caráter exclusivamente informativo e educacional. Nada aqui constitui
              recomendação de investimento, consultoria financeira ou promessa de resultado.
            </p>
            <p>
              Decisões financeiras são pessoais e dependem do contexto de cada pessoa. Recomendamos buscar orientação
              profissional adequada antes de qualquer decisão.
            </p>
          </div>
        </section>

        <section aria-label="Contato" className="mt-8 text-center">
          <h2 className="text-xl font-bold tracking-tight">Fale com a gente</h2>
          <p className="mx-auto mt-2 max-w-[560px] text-sm text-muted-foreground">
            Dúvidas sobre o conteúdo publicado? Consulte nossos{" "}
            <Link to="/termos" className="underline hover:text-brand">
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link to="/politica" className="underline hover:text-brand">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>
      </main>

      <div className="bg-black px-4">
        <SiteFooter />
      </div>
    </>
  );
}
