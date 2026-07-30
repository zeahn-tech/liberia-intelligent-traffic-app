/**
 * Check if the browser is currently online.
 */
export function getOnlineStatus(): boolean {
  return navigator.onLine;
}

/**
 * Add a listener for online/offline events.
 * Returns an unsubscribe function.
 */
export function addNetworkListener(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => onOnline?.();
  const handleOffline = () => onOffline?.();

  if (onOnline) window.addEventListener("online", handleOnline);
  if (onOffline) window.addEventListener("offline", handleOffline);

  return () => {
    if (onOnline) window.removeEventListener("online", handleOnline);
    if (onOffline) window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Attempt to ping a known endpoint to verify true connectivity
 * (beyond just browser online state).
 */
export async function verifyConnectivity(url = "https://www.google.com"): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: "HEAD",
// eslint-disable-next-line
      signal: controller.signal,
      mode: "no-cors",
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}
