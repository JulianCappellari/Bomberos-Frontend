export function getDeviceFingerprint() {
  if (typeof window === "undefined") return "";

  const raw = [
    navigator.userAgent,
    navigator.language,
    window.screen.width,
    window.screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  return btoa(raw);
}