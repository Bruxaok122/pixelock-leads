import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Como funciona a tecnologia?",
    answer:
      "Edite este texto com a explicação que você quiser. Este é apenas um exemplo de resposta.",
  },
  {
    question: "Eu preciso entender de investimentos para usar?",
    answer:
      "Edite este texto com a explicação que você quiser. Este é apenas um exemplo de resposta.",
  },
  {
    question: "Eu posso perder dinheiro usando essa tecnologia?",
    answer:
      "Edite este texto com a explicação que você quiser. Este é apenas um exemplo de resposta.",
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
      className="border-t border-border bg-background py-12"
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
