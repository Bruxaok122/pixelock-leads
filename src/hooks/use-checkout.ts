import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCheckoutLinks } from "@/lib/checkout.functions";
import { checkoutUrlFor } from "@/lib/checkout";
import { trackMetaEvent } from "@/lib/meta-pixel";

/** Resolve at click time so already-open pages never use an outdated destination. */
export function useCheckout(price: number) {
  const fetchLinks = useServerFn(getCheckoutLinks);
  const busyRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goCheckout() {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending(true);
    setError(null);
    // Reserve a tab synchronously during the user gesture to avoid popup blocking.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const links = await fetchLinks();
      const url = checkoutUrlFor(price, links);
      if (!url) throw new Error("Pagamento indisponível. Tente novamente.");
      trackMetaEvent("InitiateCheckout");
      window.dispatchEvent(new Event("ufhurd:checkout-clicked"));
      if (tab && !tab.closed) tab.location.replace(url);
      else window.location.assign(url);
    } catch (checkoutError) {
      tab?.close();
      setError(checkoutError instanceof Error ? checkoutError.message : "Não foi possível abrir o pagamento. Tente novamente.");
    } finally {
      busyRef.current = false;
      setPending(false);
    }
  }
  return { goCheckout, pending, error };
}