import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "⭐ Estou ganhando R$100,00 antes mesmo de Ativar a Tecnologia. Como isso é possível?",
    answer:
      "Sim, você já ganhou R$100,00 antes mesmo de Ativar a Tecnologia de Transferências. Seu acesso à Tecnologia custa apenas R$149,00 e adquirindo seu acesso neste exato momento você receberá R$250,00 de presente que eu te darei; estes valores serão enviados para sua conta em forma de saldo real, para testar a tecnologia ou sacar, eles já são seus. É por isso que você já está saindo no LUCRO, antes mesmo de ativar seu acesso a tecnologia, você já ganhou R$100,00 só por tomar a decisão de clicar no botão e concluir sua inscrição na Tecnologia.",
  },
  {
    question: "Eu preciso entender de investimentos para usar?",
    answer:
      "Não, você não precisa entender nada sobre investimentos para lucrar com a tecnologia. A única coisa que você precisa fazer é apertar em “Ativar tecnologia”. Toda a parte difícil (análise, execução, filtragem, risco) já foi feita pelos analistas profissionais do escritório, e quando lucrarmos automaticamente será transferido para a sua conta bancária preferida a mesma valorização que tivermos. Você não precisa se preocupar com nada.",
  },
  {
    question: "Eu posso perder dinheiro usando essa tecnologia?",
    answer:
      "Não existe essa possibilidade. A tecnologia de transferências irá apenas transferir lucros direto para sua conta bancária e, caso tenha dúvidas, existe a garantia de que você receberá no mínimo 350 reais por dia direto no seu banco preferido. Afinal, se não receber, esse dinheiro sai do nosso bolso e vai direto para o seu. Essa foi a exigência do governo brasileiro para que nossa Tecnologia fosse homologada no Brasil.",
  },
  {
    question: "Esses R$350 que eu recebo são dinheiro de verdade?",
    answer:
      "Edite este texto com a explicação que você quiser. Este é apenas um exemplo de resposta.",
  },
  {
    question: "E se eu travar no processo, ou precisar de ajuda, vou ficar sozinho?",
    answer:
      "Edite este texto com a explicação que você quiser. Este é apenas um exemplo de resposta.",
  },
];

export function FaqBlock() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      aria-label="Perguntas frequentes"
      className="border-t border-border py-12"
    >
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="text-[26px] tracking-tight sm:text-[30px]">
          Perguntas <b className="font-bold">frequentes</b>
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground">
          Aqui estão as principais perguntas caso você esteja com alguma dúvida antes de adquirir seu acesso.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-[760px]">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.question} className="border-t border-border last:border-b">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[17px] leading-snug">{item.question}</span>
                <ChevronDown
                  aria-hidden
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <p className="-mt-1 pb-5 pr-9 text-[15px] leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
