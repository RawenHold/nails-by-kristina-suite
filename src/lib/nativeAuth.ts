import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/lib/deepLinkAuth";

/**
 * Sign in with Google.
 * - On web: standard redirect via Lovable managed OAuth.
 * - On native (iOS/Android via Capacitor): opens OAuth flow in an in-app
 *   system browser tab and listens for deep-link return to close it.
 *
 * Requires the lovable OAuth callback URL to redirect back to the app's
 * web origin (which Capacitor serves locally) — the session tokens are
 * picked up by supabase.auth automatically on return.
 */
export async function signInWithGoogle(): Promise<{ error?: Error }> {
  const isNative = Capacitor.isNativePlatform();

  const redirectUri = getAuthRedirectUrl();

  if (!isNative) {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
    });
    if (result.error) return { error: result.error as Error };
    return {};
  }

  // Native flow — intercept the redirect to open it inside an in-app browser.
  return new Promise((resolve) => {
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    // Listen for the app being reopened via deep link after OAuth completes.
    App.addListener("appUrlOpen", async (event) => {
      try {
        await Browser.close();
      } catch {
        /* noop */
      }
      // The URL may contain the session in the hash (#access_token=...).
      const url = new URL(event.url);
      const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
      if (listenerHandle) await listenerHandle.remove();
      resolve({});
    }).then((handle) => {
      listenerHandle = handle;
    });

    // Kick off the OAuth flow — open initiate URL in in-app browser.
    lovable.auth
      .signInWithOAuth("google", { redirect_uri: redirectUri })
      .then(async (result) => {
        if (result.error) {
          if (listenerHandle) await (listenerHandle as any).remove();
          resolve({ error: result.error as Error });
        }
        // If the SDK already redirected via window.location, Capacitor's
        // WebView will navigate — we let it; the appUrlOpen listener
        // handles the return.
      });
  });
}
