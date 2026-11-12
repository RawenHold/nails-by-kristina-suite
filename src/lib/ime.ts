/** The live input, including an intentional empty value, is authoritative. */
export function readInputValue(element: HTMLInputElement | HTMLTextAreaElement | null, fallback = "") {
  return element?.value ?? fallback;
}

export function commitActiveInput() {
  if (typeof document === "undefined") return;
  const element = document.activeElement;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.blur();
}

/** Allow blur/composition/input events from the keyboard to settle before reading. */
export async function commitTextInput() {
  commitActiveInput();
  await new Promise<void>((resolve) => setTimeout(resolve, 80));
}