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
  sessionId: z.string().uuid().optional(),
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
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
