import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { getClaimStatus, submitLead } from "@/lib/leads.functions";
import { formatWhatsapp, isValidWhatsapp } from "@/lib/lead-validation";
import { OfferBlock } from "@/components/offer-block";
import lucasAsset from "@/assets/lucas-galhardo.jpg.asset.json";

const UNLOCK_SECONDS = 120;
const OFFER_1_SECONDS = 20 * 60;
const OFFER_2_SECONDS = 40 * 60;

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Receba sua transferência de R$350 por dia" },
      {
        name: "description",
        content:
          "Assista ao vídeo informativo e libere o seu resgate. Uma liberação disponível por CPF.",
      },
      { property: "og:title", content: "Receba sua transferência de R$350 por dia" },
      {
        property: "og:description",
        content: "Assista ao vídeo informativo e libere o seu resgate. Uma liberação disponível por CPF.",
      },
    ],
  }),
  component: Index,
});

type Stage = "locked" | "form" | "reserved";

function Index() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState<Stage>("locked");
  const [pixKey, setPixKey] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const pixRef = useRef<HTMLElement | null>(null);
  const scrolled = useRef(false);

  const send = useServerFn(submitLead);
  const claimStatus = useServerFn(getClaimStatus);

  useEffect(() => {
    void claimStatus().then((res) => {
      if (res.alreadyClaimed) {
        setBlocked(true);
        setStage("reserved");
      }
    });
  }, [claimStatus]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (elapsed >= UNLOCK_SECONDS && stage === "locked" && !blocked) setStage("form");
  }, [elapsed, stage, blocked]);

  useEffect(() => {
    if (stage !== "form" || scrolled.current) return;
    scrolled.current = true;
    window.setTimeout(() => {
      pixRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
  }, [stage]);

  const handleSubmit = useCallback(async () => {
    setFeedback(null);
    if (pixKey.trim().length < 5) {
      setFeedback("Informe a sua chave Pix.");
      return;
    }
    if (!isValidWhatsapp(whatsapp)) {
      setFeedback("Informe o seu WhatsApp com DDD.");
      return;
    }
    setSending(true);
    const result = await send({ data: { pixKey: pixKey.trim(), whatsapp: whatsapp.trim() } });
    setSending(false);
    if (result.ok) {
      setStage("reserved");
      return;
    }
    if (result.reason === "duplicate") {
      setBlocked(true);
      setStage("reserved");
      return;
    }
    setFeedback(result.message);
  }, [pixKey, whatsapp, send]);

  const showOffer2 = elapsed >= OFFER_2_SECONDS;
  const showOffer1 = elapsed >= OFFER_1_SECONDS;

  return (
    <main className="mx-auto w-full max-w-[760px] px-3 pb-14 pt-10">
      <header className="mx-auto mb-6 max-w-[760px] text-center">
        <h1 className="text-[clamp(25px,6vw,42px)] font-normal uppercase leading-[1.08] tracking-tight">
          Ative a tecnologia que transfere <b className="font-bold text-success">R$350</b> todos os dias na sua
          conta!
        </h1>
      </header>

      <section aria-label="Vídeo" className="surface-card rounded-2xl p-[7px]">
        <div
          className="relative grid aspect-video place-items-center overflow-hidden rounded-[15px]"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, oklch(0.62 0.16 255 / 40%), transparent 45%), linear-gradient(135deg, oklch(0.31 0.09 258), oklch(0.17 0.04 258) 65%, oklch(0.3 0.09 262))",
          }}
        >
          {!playing ? (
            <button
              type="button"
              aria-label="Reproduzir vídeo"
              onClick={() => setPlaying(true)}
              className="relative z-10 grid h-18 w-18 place-items-center rounded-full border border-border bg-secondary/60"
            >
              <span className="ml-1 block h-0 w-0 border-y-[12px] border-l-[17px] border-y-transparent border-l-foreground" />
            </button>
          ) : (
            <p className="relative z-10 text-sm text-muted-foreground">Reproduzindo vídeo informativo...</p>
          )}
        </div>

        <p className="mt-3 px-1 text-center text-[13px] text-muted-foreground">
          Aperte no Play e liberte seu acesso para assistir (vídeo informativo ~ Uma liberação disponível por
          CPF)
        </p>
      </section>

      {stage === "form" ? (
        <section
          ref={pixRef}
          aria-label="Formulário Pix"
          className="surface-pix reveal-up mx-auto mt-5 rounded-2xl p-5 text-pix-foreground"
        >
          <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight">
            Em qual Pix você quer receber os{" "}
            <b className="rounded-md bg-success px-2 py-0.5 text-success-foreground">R$350,00?</b>
          </h2>

          <label htmlFor="pix-key" className="mt-4 block text-sm font-bold uppercase">
            Chave pix <span className="text-destructive">*</span>
          </label>
          <input
            id="pix-key"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="CPF, telefone, e-mail ou chave aleatória"
            autoComplete="off"
            className="field-input mt-1.5 w-full rounded-xl px-4 py-3.5 text-[15px] outline-none"
          />

          <label htmlFor="whatsapp" className="mt-4 block text-sm font-bold uppercase">
            WhatsApp <span className="text-destructive">*</span>
          </label>
          <input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            autoComplete="off"
            className="field-input mt-1.5 w-full rounded-xl px-4 py-3.5 text-[15px] outline-none"
          />

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={sending}
            className="btn-cta ring-pulse mt-4 min-h-13 w-full rounded-xl text-[17px] font-extrabold disabled:opacity-70"
          >
            {sending ? "Enviando..." : "Resgatar agora"}
          </button>

          {feedback ? <p className="mt-3 text-sm font-semibold">{feedback}</p> : null}

          <p className="mt-3.5 text-center text-[13px]">Dados protegidos por criptografia</p>
        </section>
      ) : null}

      {stage === "reserved" && !showOffer1 ? (
        <section className="surface-card reveal-up mx-auto mt-5 rounded-2xl p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-2xl text-success-foreground">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-extrabold uppercase tracking-tight text-success">
            Transferência reservada com sucesso
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {blocked
              ? "Já existe um resgate registrado para você. É permitida apenas uma liberação por pessoa."
              : "Sua chave Pix foi registrada e o seu valor está reservado. Continue assistindo ao vídeo até o final para receber as instruções da liberação."}
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
            Continue assistindo para liberar a próxima etapa
          </p>
        </section>
      ) : null}

      {showOffer1 ? <OfferBlock price={showOffer2 ? 99 : 149} {...(showOffer2 ? { previousPrice: 149 } : {})} /> : null}

      <section id="artigos" className="py-12">
        <div className="mb-6 text-center">
          <small className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-soft">
            Conteúdo
          </small>
          <h2 className="text-2xl font-extrabold tracking-tight">Principais assuntos</h2>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <article className="surface-card rounded-2xl p-5">
            <span className="text-[10px] font-extrabold uppercase text-brand-soft">Novidade tecnológica</span>
            <h3 className="my-2 text-[17px] font-bold leading-tight">
              Uma nova tecnologia brasileira despertando interesse
            </h3>
            <p className="text-xs text-muted-foreground">
              Conheça a proposta, entenda como a tecnologia funciona e acompanhe os impactos que novas soluções
              brasileiras podem trazer para o mundo.
            </p>
            <div className="mt-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
              Conteúdo informativo
            </div>
          </article>

          <article className="surface-card rounded-2xl p-5">
            <span className="text-[10px] font-extrabold uppercase text-brand-soft">Tecnologia brasileira</span>
            <h3 className="my-2 text-[17px] font-bold leading-tight">
              Por que essa novidade está chamando atenção?
            </h3>
            <p className="text-xs text-muted-foreground">
              Explicamos de forma simples o que existe por trás da novidade, suas possíveis aplicações e o que já
              pode ser confirmado sobre ela.
            </p>
            <div className="mt-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
              Análise e contexto
            </div>
          </article>
        </div>
      </section>

      <section id="sobre" className="pb-12">
        <div className="mb-6 text-center">
          <small className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-soft">
            Conheça
          </small>
          <h2 className="text-2xl font-extrabold tracking-tight">Sobre Lucas Galhardo</h2>
        </div>

        <div className="mx-auto max-w-[760px] px-4 text-center">
          <div className="surface-card mx-auto mb-4 w-28 overflow-hidden rounded-2xl">
            <img
              src={lucasAsset.url}
              alt="Retrato de Lucas Galhardo"
              className="block h-full w-full object-contain"
              loading="lazy"
            />
          </div>

          <h3 className="text-[25px] font-bold tracking-tight">
            Lucas Galhardo
            <span className="ml-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand align-middle text-[11px] text-primary-foreground">
              ✓
            </span>
          </h3>

          <div className="mt-4 grid gap-3.5 text-sm text-muted-foreground">
            <p>
              Um dos orgulhos brasileiros, criador da Tecnologia de Transferência de Lucros e fundador do
              escritório que administra MAIS de 1 bilhão de dólares.
            </p>
            <p>
              Lucas Galhardo, brasileiro de 39 anos, reconhecido por gerenciar e rentabilizar o capital financeiro
              das MAIORES empresas do mundo, desenvolveu a Novidade Tecnologia que possibilita brasileiros comuns
              ganharem no mínimo R$350 reais todos os dias.
            </p>
            <p>
              Reconhecida como a “maior revolução após o fogo”, esta Novidade Tecnológica foi aprovada e
              homologada no Brasil pelo Banco Central em 20 de novembro de 2025, e se tornou febre em todo o país
              por proporcionar qualquer brasileiro mesmo sem investir um único centavo, receber no mínimo R$350
              reais todos os dias garantidamente!
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border pt-6 text-center text-[10px] text-muted-foreground">
        Conteúdo informativo. Uma liberação disponível por CPF.
      </footer>
    </main>
  );
}
