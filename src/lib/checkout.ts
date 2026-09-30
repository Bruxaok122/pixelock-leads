// Destinos finais dos links SyncPayments: o encurtador descarta a query no redirecionamento.
export const CHECKOUT_BY_PRICE: Record<number, string> = {
  149.99: "https://syncpaycheckout.com/checkout/a2d9aa7b-6938-4b1a-9674-c41fbecc09c7+a2d9ae6f-7cb7-4199-9ad3-ca064a0f1649",
  119.99: "https://syncpaycheckout.com/checkout/a2d9b348-b36a-4e02-b206-e00c8084846a+a2d9ae6f-7cb7-4199-9ad3-ca064a0f1649",
  19: "https://syncpaycheckout.com/checkout/a2d9b375-505e-40b5-ae64-f85dfe733bbb+a2d9ae6f-7cb7-4199-9ad3-ca064a0f1649",
};

const TRACKING_PARAMETERS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
  "src", "xcod", "sck", "fbclid", "gclid", "gbraid", "wbraid", "ttclid", "tbclid",
] as const;

/** Repassa a atribuição para o checkout mesmo se o script da UTMify ainda não carregou. */
export function checkoutUrlFor(price: number): string | null {
  const destination = CHECKOUT_BY_PRICE[price];
  if (!destination) return null;

  const url = new URL(destination);
  const incoming = new URLSearchParams(window.location.search);
  const utmify = (window as Window & { utmParams?: URLSearchParams }).utmParams;
  for (const parameter of TRACKING_PARAMETERS) {
    const value = utmify?.get(parameter) || incoming.get(parameter);
    if (value) url.searchParams.set(parameter, value);
  }
  return url.toString();
}

// Desconto do Pix por valor da oferta (sobe conforme o preço cai no vídeo).
export const PIX_DISCOUNT_BY_PRICE: Record<number, number> = {
  149.99: 0.05,
  119.99: 0.1,
  19: 0.2,
};

export function pixDiscountFor(price: number): number {
  return PIX_DISCOUNT_BY_PRICE[price] ?? 0.05;
}

export function pixPriceFor(price: number): number {
  return Math.round(price * (1 - pixDiscountFor(price)) * 100) / 100;
}
