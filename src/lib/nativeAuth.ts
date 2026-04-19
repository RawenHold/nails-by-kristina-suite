import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/lib/deepLinkAuth";

type OAuthProvider = "google" | "apple";

/**
 * Sign in with a managed OAuth provider (Google / Apple).
 * - On web: standard redirect via Lovable managed OAuth.
 * - On native (iOS/Android via Capacitor): opens the OAuth flow in an
 *   in-app system browser tab and listens for the deep-link return to
 *   close the tab and pick up the session tokens.
 */
async function signInWithProvider(provider: OAuthProvider): Promise<{ error?: Error }> {
  const isNative = Capacitor.isNativePlatform();
  const redirectUri = getAuthRedirectUrl();

  if (!isNative) {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectUri });
    if (result.error) return { error: result.error as Error };
    return {};
  }

  return new Promise((resolve) => {
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    App.addListener("appUrlOpen", async (event) => {
      try {
        await Browser.close();
      } catch {
        /* noop */
      }
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

    lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectUri }).then(async (result) => {
      if (result.error) {
        if (listenerHandle) await (listenerHandle as any).remove();
        resolve({ error: result.error as Error });
      }
    });
  });
}

export const signInWithGoogle = () => signInWithProvider("google");
export const signInWithApple = () => signInWithProvider("apple");
