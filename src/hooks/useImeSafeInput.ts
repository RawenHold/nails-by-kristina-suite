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
    // On Android WebView/IME the freshest value is usually the last onInput /
    // onCompositionEnd snapshot. Using the "longest string wins" heuristic can
    // resurrect stale text when the user shortens or clears the field.
    return latest.current ?? ref.current?.value ?? "";
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
