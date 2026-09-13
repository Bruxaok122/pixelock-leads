import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(getAnalyticsConsent() === null), []);
  if (!visible) return null;

  const choose = (value: "accepted" | "rejected") => {
    setAnalyticsConsent(value);
    setVisible(false);
  };

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-border bg-popover p-4 shadow-xl" aria-label="Preferências de privacidade">
      <p className="text-sm font-bold">Sua privacidade</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Com sua permissão, usamos dados anônimos de navegação e o Pixel Meta para entender o uso desta página. Não registramos o que você digita.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => choose("rejected")}>Recusar</Button>
        <Button size="sm" onClick={() => choose("accepted")}>Aceitar</Button>
      </div>
    </aside>
  );
}