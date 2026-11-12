import { useCallback, useRef } from "react";
import { readInputValue } from "@/lib/ime";

/** Text drafts are independent of state changes to dates, amounts and selectors. */
export function useImeSafeFields<T extends Record<string, string>>(initial: T) {
  const values = useRef({ ...initial });
  const nodes = useRef<Partial<Record<keyof T, HTMLInputElement | HTMLTextAreaElement>>>({});
  const reset = useCallback((next: T) => {
    values.current = { ...next };
    for (const key of Object.keys(next) as (keyof T)[]) {
      const node = nodes.current[key];
      if (node) node.value = next[key];
    }
  }, []);
  const read = useCallback((): T => {
    const result = { ...values.current };
    for (const key of Object.keys(result) as (keyof T)[]) {
      result[key] = readInputValue(nodes.current[key] ?? null, result[key]) as T[keyof T];
    }
    return result;
  }, []);
  const field = (key: keyof T) => ({
    ref: (node: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (node) nodes.current[key] = node;
      else {
        const previous = nodes.current[key];
        if (previous) values.current[key] = previous.value as T[keyof T];
        delete nodes.current[key];
      }
    },
    defaultValue: values.current[key],
    lang: "ru",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    onInput: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      values.current[key] = event.currentTarget.value as T[keyof T];
    },
    onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      values.current[key] = event.currentTarget.value as T[keyof T];
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      values.current[key] = event.currentTarget.value as T[keyof T];
    },
  });
  return { field, read, reset };
}