import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Em Alta no Mundo" },
      {
        name: "description",
        content:
          "Termos de uso da plataforma Em Alta no Mundo. Condições de acesso, uso e responsabilidades.",
      },
      { property: "og:title", content: "Termos de Uso — Em Alta no Mundo" },
      {
        property: "og:description",
        content:
          "Termos de uso da plataforma Em Alta no Mundo. Condições de acesso, uso e responsabilidades.",
      },
    ],
  }),
  component: TermosPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Aceitação dos termos",
    body: [
      "Ao acessar e utilizar este site, você concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer item aqui descrito, não utilize a plataforma.",
      "O uso continuado do site após eventuais atualizações destes termos implica na aceitação tácita das modificações.",
    ],
  },
  {
    title: "2. Descrição do serviço",
    body: [
      "O Em Alta no Mundo disponibiliza conteúdo informativo e educacional, incluindo vídeos, materiais e demonstrações sobre tecnologias e estratégias financeiras.",
      "As informações apresentadas têm caráter exclusivamente informativo e não constituem recomendação de investimento, aconselhamento financeiro ou garantia de resultados.",
    ],
  },
  {
    title: "3. Cadastro e dados",
    body: [
      "Para acesso a determinadas funcionalidades, poderá ser solicitado o fornecimento de dados como chave Pix e número de WhatsApp.",
      "Você declara que as informações fornecidas são verdadeiras, corretas e de sua titularidade, assumindo total responsabilidade por dados incorretos ou de terceiros.",
    ],
  },
  {
    title: "4. Uso permitido",
    body: [
      "Você se compromete a utilizar a plataforma de forma lícita, respeitando a legislação aplicável e os direitos de terceiros.",
      "É proibido tentar burlar restrições de acesso, criar múltiplas contas indevidamente, ou utilizar automatizações que sobrecarreguem ou comprometam o funcionamento do site.",
    ],
  },
  {
    title: "5. Limitação de responsabilidade",
    body: [
      "O Em Alta no Mundo não se responsabiliza por decisões tomadas com base nas informações apresentadas, nem por eventuais perdas financeiras decorrentes do uso da plataforma.",
      "Resultados apresentados em materiais exemplificativos não garantem resultados idênticos para todos os usuários.",
    ],
  },
  {
    title: "6. Propriedade intelectual",
    body: [
      "Todo o conteúdo do site — textos, vídeos, imagens, marcas e layouts — é de propriedade do Em Alta no Mundo e protegido por leis de propriedade intelectual.",
      "É proibida a reprodução, distribuição ou comercialização do conteúdo sem autorização expressa por escrito.",
    ],
  },
  {
    title: "7. Alterações dos termos",
    body: [
      "Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento, sendo de sua responsabilidade revisá-los periodicamente.",
    ],
  },
  {
    title: "8. Legislação aplicável",
    body: [
      "Estes termos são regidos pela legislação brasileira. Eventuais disputas serão dirimidas no foro competente da comarca do endereço da empresa.",
    ],
  },
];

function TermosPage() {
  return (
    <main className="mx-auto w-full max-w-[760px] px-3 pb-14 pt-10">
      <header className="mx-auto mb-8 max-w-[760px] text-center">
        <small className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-soft">
          Legal
        </small>
        <h1 className="mt-2 text-[clamp(26px,6vw,40px)] font-extrabold uppercase leading-[1.1] tracking-tight">
          Termos de Uso
        </h1>
        <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground">
          Última atualização: agosto de 2026. Leia atentamente as condições abaixo.
        </p>
      </header>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="surface-card rounded-2xl p-6">
            <h2 className="text-[18px] font-bold tracking-tight">{section.title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
              {section.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
