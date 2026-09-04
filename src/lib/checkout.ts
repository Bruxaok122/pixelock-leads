// Links de checkout (SyncPayments) por valor da oferta, conforme progressão do vídeo.
export const CHECKOUT_BY_PRICE: Record<number, string> = {
  149.99: "https://app.syncpayments.com.br/payment-link/a2a9454c-e2f5-41cb-b2d4-a4f4465a0de8",
  119.99: "https://app.syncpayments.com.br/payment-link/a2a946e2-f52c-45cb-99b1-68ca248e946e",
  19: "https://app.syncpayments.com.br/payment-link/a2a9475e-7c30-4567-a792-6a32ddc0708c",
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
