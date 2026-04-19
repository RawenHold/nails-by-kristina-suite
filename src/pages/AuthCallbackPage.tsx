import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/logo.svg";
import { APP_URL_SCHEME, consumeAuthCallbackUrl } from "@/lib/deepLinkAuth";

type CallbackState = "redirecting" | "finishing" | "error";

function buildNativeDeepLink(currentUrl: string) {
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.search);
  params.delete("native");

  const search = params.toString();
  return `${APP_URL_SCHEME}://auth/callback${search ? `?${search}` : ""}${url.hash}`;
}

export default function AuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("finishing");

  const shouldRedirectToApp = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("native") === "1";
  }, [location.search]);

  const manualOpenUrl = useMemo(() => buildNativeDeepLink(window.location.href), []);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      if (shouldRedirectToApp) {
        setState("redirecting");
        window.location.replace(buildNativeDeepLink(window.location.href));
        return;
      }

      setState("finishing");
      const success = await consumeAuthCallbackUrl(window.location.href);
      if (cancelled) return;

      if (!success) {
        setState("error");
        return;
      }

      navigate("/", { replace: true });
    };

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate, shouldRedirectToApp]);

  const title = state === "error" ? "Не удалось подтвердить email" : "Подтверждаем вход";
  const description =
    state === "redirecting"
      ? "Открываем приложение…"
      : state === "error"
        ? "Ссылка устарела или недействительна. Попробуйте отправить письмо ещё раз."
        : "Завершаем авторизацию…";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-lg"
      >
        <img src={logo} alt="K Nails Finance" className="mx-auto mb-5 h-16 w-16 drop-shadow-lg" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        {state !== "error" && (
          <div className="mx-auto mt-6 h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        )}

        {shouldRedirectToApp && (
          <a
            href={manualOpenUrl}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Открыть приложение вручную
          </a>
        )}
      </motion.div>
    </div>
  );
}
