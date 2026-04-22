import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";

/**
 * Native app scheme and HTTPS bridge used for auth callbacks.
 *
 * Lovable Cloud only accepts HTTPS redirect URLs, so native auth flows first
 * land on the published `/auth/callback` route and that page immediately
 * forwards the payload into the app via `knailsfinance://auth/callback`.
 *
 * Native config required (one-time, after `npx cap add`):
 *  - iOS:     ios/App/App/Info.plist  → CFBundleURLTypes → CFBundleURLSchemes: ["knailsfinance"]
 *  - Android: android/app/src/main/AndroidManifest.xml → <intent-filter> with
 *             <data android:scheme="knailsfinance" />
 */
export const APP_URL_SCHEME = "knailsfinance";
export const AUTH_CALLBACK_URL = `${APP_URL_SCHEME}://auth/callback`;
export const PUBLISHED_AUTH_BRIDGE_URL = "https://k-nails-finance.lovable.app/auth/callback";

/**
 * Returns the correct redirect URL for auth flows depending on platform.
 * - Native (iOS/Android): published HTTPS bridge on the lovable.app domain.
 * - Web: current origin → standard browser flow.
 */
export function getAuthRedirectUrl(): string {
  return Capacitor.isNativePlatform()
    ? `${PUBLISHED_AUTH_BRIDGE_URL}?native=1`
    : `${window.location.origin}/auth/callback`;
}

/**
 * Password reset links must always use an HTTPS URL.
 * On native we send users through the published auth bridge, which then
 * forwards them back into the app via the custom scheme.
 */
export function getPasswordResetRedirectUrl(): string {
  return Capacitor.isNativePlatform()
    ? `${PUBLISHED_AUTH_BRIDGE_URL}?native=1`
    : `${window.location.origin}/reset-password`;
}

/**
 * Consumes an auth callback URL and establishes the session when tokens or a
 * PKCE code are present.
 */
export async function consumeAuthCallbackUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return !error;
    }
    // Hash-based error (e.g. expired link)
    if (params.get("error")) return false;
  }

  // New-style email links: ?token_hash=...&type=recovery|signup|magiclink|email
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "recovery" | "signup" | "magiclink" | "email" | "invite" | "email_change",
    });
    return !error;
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }

  return false;
}

let listenerInitialized = false;

/**
 * Initializes a global listener for deep-link callbacks (auth confirmation,
 * OAuth return, etc.). Safe to call once at app startup.
 */
export async function initDeepLinkAuth(): Promise<void> {
  if (listenerInitialized) return;
  if (!Capacitor.isNativePlatform()) return;
  listenerInitialized = true;

  await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    try {
      await Browser.close();
    } catch {
      /* noop — browser may not be open */
    }
    await consumeAuthCallbackUrl(event.url);
  });

  const { url } = await App.getLaunchUrl();
  if (url) {
    await consumeAuthCallbackUrl(url);
  }
}
