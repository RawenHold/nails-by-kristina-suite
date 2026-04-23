import { useRef, useCallback } from "react";

/**
 * Hook to reliably capture text input values on Android WebView, where the IME
 * composition can drop the last typed character/word if React re-renders
 * (controlled inputs) or if the user submits before the composition commits.
 *
 * Usage:
 *   const note = useImeSafeInput(initialValue);
 *   <input ref={note.ref} defaultValue={note.initial} onInput={note.onInput} onCompositionEnd={note.onCompositionEnd} />
 *   // later:
 *   const value = note.read();
 */
export function useImeSafeInput<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  initial: string = ""
) {
  const ref = useRef<T | null>(null);
  const latest = useRef<string>(initial);

  const onInput = useCallback((e: React.FormEvent<T>) => {
    latest.current = (e.currentTarget as T).value;
  }, []);

  const onCompositionEnd = useCallback((e: React.CompositionEvent<T>) => {
    latest.current = (e.currentTarget as T).value;
  }, []);

  const read = useCallback(() => {
    // Prefer DOM value (most up-to-date) but fall back to our captured value.
    const domVal = ref.current?.value;
    if (domVal && domVal.length >= latest.current.length) return domVal;
    return latest.current;
  }, []);

  const reset = useCallback((v: string) => {
    latest.current = v;
    if (ref.current) ref.current.value = v;
  }, []);

  return { ref, initial, onInput, onCompositionEnd, read, reset };
}

/**
 * Force any currently-focused input/textarea to commit its IME composition
 * by blurring it. Call this on pointerDown of submit buttons.
 */
export function commitActiveInput() {
  const el = (typeof document !== "undefined" ? document.activeElement : null) as HTMLElement | null;
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
    el.blur();
  }
}
