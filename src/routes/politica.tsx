import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/politica")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Em Alta no Mundo" },
      {
        name: "description",
        content:
          "Política de privacidade da plataforma Em Alta no Mundo. Coleta, uso e proteção dos seus dados.",
      },
      { property: "og:title", content: "Política de Privacidade — Em Alta no Mundo" },
      {
        property: "og:description",
        content:
          "Política de privacidade da plataforma Em Alta no Mundo. Coleta, uso e proteção dos seus dados.",
      },
    ],
  }),
  component: PoliticaPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Informações que coletamos",
    body: [
      "Para o funcionamento da plataforma, podemos coletar os seguintes dados fornecidos por você: chave Pix e número de WhatsApp.",
      "Além disso, coletamos automaticamente dados de acesso, como endereço IP, data e hora de acesso, e informações do navegador, para fins de segurança e auditoria.",
    ],
  },
  {
    title: "2. Como utilizamos seus dados",
    body: [
      "Os dados coletados são utilizados para identificar e registrar cada solicitação de resgate, evitando usos indevidos e garantindo a integridade da plataforma.",
      "Os dados de contato (WhatsApp) podem ser utilizados para comunicação relacionada ao seu acesso, sempre respeitando a sua privacidade.",
    ],
  },
  {
    title: "3. Compartilhamento de dados",
    body: [
      "Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais.",
      "O compartilhamento poderá ocorrer apenas quando exigido por lei, ordem judicial ou autoridade competente, ou para proteção dos direitos da empresa.",
    ],
  },
  {
    title: "4. Proteção dos dados",
    body: [
      "Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia no envio das informações.",
      "Apesar dos esforços, nenhum método de transmissão pela internet é totalmente seguro, e não podemos garantir segurança absoluta.",
    ],
  },
  {
    title: "5. Retenção dos dados",
    body: [
      "Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política e conforme exigido pela legislação aplicável.",
    ],
  },
  {
    title: "6. Seus direitos (LGPD)",
    body: [
      "Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar acesso, correção, anonimização ou exclusão dos seus dados pessoais.",
      "Para exercer qualquer direito, entre em contato através dos canais de suporte da empresa.",
    ],
  },
  {
    title: "7. Cookies",
    body: [
      "Com seu consentimento, utilizamos tecnologias similares a cookies para medir visualizações, cliques, rolagem, tempo de permanência, progresso do vídeo e movimentos amostrados do ponteiro. Não registramos teclas pressionadas nem o conteúdo digitado nos campos.",
      "Também podemos carregar o Pixel Meta para medir campanhas. Esse recurso e a análise detalhada permanecem desligados até você aceitar. A recusa não impede o uso da página.",
    ],
  },
  {
    title: "8. Alterações desta política",
    body: [
      "Esta Política de Privacidade pode ser atualizada a qualquer momento. Recomendamos a consulta periódica para acompanhar eventuais mudanças.",
    ],
  },
];

function PoliticaPage() {
  return (
    <main className="mx-auto w-full max-w-[760px] px-3 pb-14 pt-10">
      <header className="mx-auto mb-8 max-w-[760px] text-center">
        <small className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-soft">
          Legal
        </small>
        <h1 className="mt-2 text-[clamp(26px,6vw,40px)] font-extrabold uppercase leading-[1.1] tracking-tight">
          Política de Privacidade
        </h1>
        <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground">
          Última atualização: agosto de 2026. Saiba como tratamos seus dados.
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
