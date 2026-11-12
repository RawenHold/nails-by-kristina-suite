import { useRef, useCallback } from "react";
import { readInputValue } from "@/lib/ime";
export { commitActiveInput, commitTextInput } from "@/lib/ime";

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
    return readInputValue(ref.current, latest.current);
  }, []);

  const reset = useCallback((v: string) => {
    latest.current = v;
    if (ref.current) ref.current.value = v;
  }, []);

  return { ref, initial: latest.current, onInput, onCompositionEnd, onBlur: onInput, read, reset };
}
