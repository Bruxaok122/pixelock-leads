import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { getClaimStatus, submitLead } from "@/lib/leads.functions";
import { formatWhatsapp, isValidWhatsapp } from "@/lib/lead-validation";
import { OfferBlock } from "@/components/offer-block";
import lucasAsset from "@/assets/lucas-galhardo.jpg.asset.json";
import { GuaranteeBlock } from "@/components/guarantee-block";
import { FaqBlock } from "@/components/faq-block";
import { SiteFooter } from "@/components/site-footer";
import { VturbPlayer } from "@/components/vturb-player";
import { ExitIntentModal } from "@/components/exit-intent-modal";
import { TrackingRuntime } from "@/components/tracking-runtime";

const UNLOCK_SECONDS = 120;
const OFFER_1_SECONDS = 17 * 60 + 30;
const OFFER_2_SECONDS = 36 * 60 + 25;
const OFFER_3_SECONDS = 51 * 60 + 5;
const CONTENT_UNLOCK_SECONDS = 29 * 60 + 30;

/** Formato MM:SS usado no novo temporizador sobreposto. */
function clockLabel(remaining: number): string {
  const safe = Math.max(0, Math.ceil(remaining));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const Route = createFileRoute("/ufhurd")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Receba sua transferência de R$350 por dia" },
      {
        name: "description",
        content: "Assista ao vídeo informativo e libere o seu resgate. Uma liberação disponível por CPF.",
      },
      { property: "og:title", content: "Receba sua transferência de R$350 por dia" },
      {
        property: "og:description",
        content: "Assista ao vídeo informativo e libere o seu resgate. Uma liberação disponível por CPF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Stage = "locked" | "form" | "processing" | "validated" | "reserved";

function Index() {
  const [elapsed, setElapsed] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

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

  const handleTime = useCallback((seconds: number) => {
    setElapsed((prev) => (seconds > prev ? Math.floor(seconds) : prev));
  }, []);

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
    setStage("processing");
    setSending(true);
    // Simulação de processamento para reforçar confiabilidade antes da validação real.
    await new Promise((resolve) => window.setTimeout(resolve, 1800));
    const result = await send({ data: { pixKey: pixKey.trim(), whatsapp: whatsapp.trim() } });
    setSending(false);
    if (result.ok) {
      window.dispatchEvent(new Event("ufhurd:lead-submitted"));
      setStage("validated");
      window.setTimeout(() => setStage("reserved"), 1600);
      return;
    }
    if (result.reason === "duplicate") {
      setBlocked(true);
      setStage("reserved");
      return;
    }
    setStage("form");
    setFeedback(result.message);
  }, [pixKey, whatsapp, send]);

  const showOffer = elapsed >= OFFER_1_SECONDS;
  const offerPrice = elapsed >= OFFER_3_SECONDS ? 19 : elapsed >= OFFER_2_SECONDS ? 119.99 : 149.99;
  const previousPrice = elapsed >= OFFER_3_SECONDS ? 119.99 : elapsed >= OFFER_2_SECONDS ? 149.99 : undefined;
  const showContent = elapsed >= CONTENT_UNLOCK_SECONDS;

  return (
    <>
      <TrackingRuntime
        videoSeconds={elapsed}
        converted={stage === "reserved"}
        pixUnlocked={elapsed >= UNLOCK_SECONDS}
        videoPlaying={videoPlaying}
      />
      <ExitIntentModal />
      <main className="mx-auto w-full max-w-[760px] px-3 pb-14 pt-10">
        <header className="mx-auto mb-6 max-w-[760px] text-center">
          <h1 className="text-[clamp(25px,6vw,42px)] font-normal uppercase leading-[1.08] tracking-tight">
            ATIVE A TECNOLOGIA QUE TRANSFERE <b className="font-bold text-success">R$350</b> TODOS OS DIAS NA SUA CONTA!
          </h1>
        </header>

        <section aria-label="Vídeo" className="surface-card rounded-2xl p-[7px]">
          <VturbPlayer onTime={handleTime} onPlaybackChange={setVideoPlaying} />

          <p className="mt-3 px-1 text-center text-[13px] text-foreground">
            <b className="font-bold">Aperte no Play</b> e receba 250 reais só por assistir (vídeo em parceria com o
            Banco Central do Brasil ~ Uma transferência disponível por CPF)
          </p>
        </section>

        {stage === "locked" ? (
          <section
            aria-label="Formulário Pix bloqueado"
            className="surface-pix relative mx-auto mt-5 overflow-hidden rounded-2xl p-5 text-pix-foreground"
          >
            {/* Conteúdo real desfocado: o lead vê o formulário, mas ainda bloqueado. */}
            <div aria-hidden className="pointer-events-none select-none blur-[6px] opacity-70">
              <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight">
                Em qual Pix você quer receber os{" "}
                <b className="rounded-md bg-success px-2 py-0.5 text-success-foreground">R$250,00?</b>
              </h2>

              <p className="mt-4 block text-sm font-bold uppercase">Chave pix *</p>
              <div className="field-input mt-1.5 w-full rounded-xl px-4 py-3.5 text-[15px] opacity-70">
                CPF, telefone, e-mail ou chave aleatória
              </div>

              <p className="mt-4 block text-sm font-bold uppercase">WhatsApp *</p>
              <div className="field-input mt-1.5 w-full rounded-xl px-4 py-3.5 text-[15px] opacity-70">
                (00) 00000-0000
              </div>

              <div className="btn-cta mt-4 min-h-13 w-full rounded-xl py-3.5 text-center text-[17px] font-extrabold">
                Receber transferência
              </div>

              <p className="mt-3.5 text-center text-[13px]">Dados protegidos por criptografia</p>
            </div>

            {/* Temporizador sobreposto */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-[15px] font-medium text-pix-foreground">Preenchimento disponível em</p>
              <p className="mt-1 text-[38px] font-extrabold leading-none tabular-nums text-pix-foreground">
                {clockLabel(UNLOCK_SECONDS - elapsed)}
              </p>

              <div className="mt-4 h-[6px] w-full max-w-[420px] overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-500 ease-linear"
                  style={{ width: `${Math.min(100, (elapsed / UNLOCK_SECONDS) * 100)}%` }}
                />
              </div>

              <p className="mt-4 flex max-w-[420px] items-start gap-2 text-left text-[13px] leading-snug text-pix-foreground/90">
                <span aria-hidden>👆</span>
                Clique em assistir a entrevista enquanto a sua transferência é liberada
              </p>
            </div>
          </section>
        ) : null}

        {stage === "form" ? (
          <section
            ref={pixRef}
            aria-label="Formulário Pix"
            className="surface-pix reveal-up mx-auto mt-5 rounded-2xl p-5 text-pix-foreground"
          >
            <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight">
              Em qual Pix você quer receber os{" "}
              <b className="rounded-md bg-success px-2 py-0.5 text-success-foreground">R$250,00?</b>
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

        {stage === "processing" ? (
          <section
            aria-label="Processando validação"
            className="surface-card reveal-up mx-auto mt-5 rounded-2xl p-7 text-center"
          >
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <p className="mt-4 text-[19px] font-semibold">Validando seus dados...</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Verificando chave Pix e disponibilidade do resgate.
            </p>
          </section>
        ) : null}

        {stage === "validated" ? (
          <section className="surface-card reveal-up mx-auto mt-5 rounded-2xl p-7 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-lg font-bold text-success-foreground">
              ✓
            </div>
            <p className="mt-4 text-[19px] font-semibold">Chave Pix validada!</p>
          </section>
        ) : null}

        {stage === "reserved" && !showOffer ? (
          <section className="reveal-up mx-auto mt-5 rounded-2xl bg-sheet p-6 text-center text-sheet-foreground">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-lg font-bold text-success-foreground">
              ✓
            </div>
            <h2 className="mt-4 text-[21px] font-bold tracking-tight">Transferência Reservada com Sucesso.</h2>
            <p className="mt-1 text-[14px] opacity-70">Continue assistindo para garantir!</p>

            <div className="mt-5 rounded-xl bg-black/[0.04] p-4 text-left">
              <p className="text-[15px]">R$250,00 Reservados para:</p>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-sheet px-4 py-3">
                <span className="text-[14px] opacity-50">Chave Pix</span>
                <span className="truncate text-[15px] font-semibold">{blocked ? "Resgate já registrado" : pixKey}</span>
              </div>
            </div>
          </section>
        ) : null}

        {showOffer ? <OfferBlock price={offerPrice} {...(previousPrice ? { previousPrice } : {})} /> : null}

        {showContent ? (
          <>
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

            <GuaranteeBlock price={offerPrice} />
          </>
        ) : null}
      </main>

      {showContent ? (
        <div className="bg-black px-4">
          <FaqBlock />
          <SiteFooter />
        </div>
      ) : null}
    </>
  );
}
