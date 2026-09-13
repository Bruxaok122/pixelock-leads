export const ANALYTICS_CONSENT_KEY = "emaltanomundo-analytics-consent";

export type AnalyticsConsent = "accepted" | "rejected" | null;

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>): void {
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("analytics-consent-changed", { detail: value }));
}