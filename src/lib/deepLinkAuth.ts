import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom URL scheme used for deep-linking back into the native app
 * (e.g. from email-confirmation links and OAuth redirects).
 *
 * When Supabase sends auth emails, the confirmation link will use this
 * scheme so tapping it opens the app directly instead of a browser.
 *
 * Native config required (one-time, after `npx cap add`):
 *  - iOS:     ios/App/App/Info.plist  → CFBundleURLTypes → CFBundleURLSchemes: ["knailsfinance"]
 *  - Android: android/app/src/main/AndroidManifest.xml → <intent-filter> with
 *             <data android:scheme="knailsfinance" />
 *  - Lovable Cloud → Auth → URL Configuration → add to Redirect URLs:
 *             knailsfinance://auth/callback
 */
export const APP_URL_SCHEME = "knailsfinance";
export const AUTH_CALLBACK_URL = `${APP_URL_SCHEME}://auth/callback`;

/**
 * Returns the correct redirect URL for auth flows depending on platform.
 * - Native (iOS/Android): custom scheme → opens app directly from email/browser.
 * - Web: current origin → standard browser flow.
 */
export function getAuthRedirectUrl(): string {
  return Capacitor.isNativePlatform() ? AUTH_CALLBACK_URL : window.location.origin;
}

/**
 * Parses an incoming deep-link URL and, if it carries Supabase auth tokens
 * (either in the hash fragment after email confirmation/OAuth, or as a
 * `code` query param for PKCE), establishes the session.
 */
async function handleAuthDeepLink(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  // Implicit flow / OAuth: tokens delivered in URL hash.
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return !error;
    }
  }

  // PKCE flow: ?code=... in the query string.
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
 *
 * No-op on web — there the standard URL-based session detection in
 * supabase-js handles the redirect on page load.
 */
export async function initDeepLinkAuth(): Promise<void> {
  if (listenerInitialized) return;
  if (!Capacitor.isNativePlatform()) return;
  listenerInitialized = true;

  await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    // Close any in-app browser tab that was opened for OAuth.
    try {
      await Browser.close();
    } catch {
      /* noop — browser may not be open */
    }
    await handleAuthDeepLink(event.url);
  });
}
