// Links de checkout (SyncPayments) por valor da oferta, conforme progressão do vídeo.
export const CHECKOUT_BY_PRICE: Record<number, string> = {
  149.99: "https://link.syncpayments.com.br/3gGDFd",
  119.99: "https://link.syncpayments.com.br/zzBWVU",
  19: "https://link.syncpayments.com.br/1O7l4Q",
};

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
