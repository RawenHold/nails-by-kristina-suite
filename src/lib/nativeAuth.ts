import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { lovable } from "@/integrations/lovable";
import { consumeAuthCallbackUrl, getAuthRedirectUrl } from "@/lib/deepLinkAuth";

type OAuthProvider = "google" | "apple";

/**
 * Sign in with a managed OAuth provider (Google / Apple).
 * - On web: standard redirect via Lovable managed OAuth.
 * - On native (iOS/Android via Capacitor): opens the OAuth flow in an
 *   in-app system browser tab and waits for the HTTPS auth bridge to forward
 *   the callback back into the app via the custom URL scheme.
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

      await consumeAuthCallbackUrl(event.url);

      if (listenerHandle) await listenerHandle.remove();
      resolve({});
    }).then((handle) => {
      listenerHandle = handle;
    });

    lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectUri }).then(async (result) => {
      if (result.error) {
        if (listenerHandle) await listenerHandle.remove();
        resolve({ error: result.error as Error });
      }
    });
  });
}

export const signInWithGoogle = () => signInWithProvider("google");
export const signInWithApple = () => signInWithProvider("apple");
