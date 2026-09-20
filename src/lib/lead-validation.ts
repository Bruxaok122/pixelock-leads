import { z } from "zod";

export const leadInputSchema = z.object({
  pixKey: z
    .string()
    .trim()
    .min(5, { message: "Informe uma chave Pix válida" })
    .max(140, { message: "Chave Pix muito longa" }),
  whatsapp: z
    .string()
    .trim()
    .min(10, { message: "Informe um WhatsApp válido com DDD" })
    .max(25, { message: "WhatsApp inválido" }),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function isValidWhatsapp(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length >= 10 && digits.length <= 13;
}

export function formatWhatsapp(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappLink(value: string): string {
  const digits = onlyDigits(value);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function formatDateTime(iso: string): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getBrasiliaDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}

export function getBrasiliaDayBounds(dateKey: string): { from: string; to: string } {
  if (!DATE_KEY_PATTERN.test(dateKey)) throw new Error("Data inválida.");

  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Data inválida.");

  const start = new Date(Date.UTC(year, month - 1, day, 3));
  const next = new Date(Date.UTC(year, month - 1, day + 1, 3));
  if (
    start.getUTCFullYear() !== year ||
    start.getUTCMonth() !== month - 1 ||
    start.getUTCDate() !== day
  ) {
    throw new Error("Data inválida.");
  }

  return { from: start.toISOString(), to: next.toISOString() };
}
