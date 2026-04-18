import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as money with thin non-breaking space thousand separators.
 * 100000 → "100 000", 1000000 → "1 000 000"
 */
export function formatMoney(value: number | null | undefined): string {
  if (value == null || isNaN(value as number)) return "0";
  const n = Math.round(Number(value));
  // Use thin non-breaking space (U+202F) so "100 000 сум" never wraps awkwardly
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

/**
 * Parse a user-entered money string ("100 000", "100000", "100,000") into a number.
 */
export function parseMoney(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[\s\u00A0\u202F,]/g, "");
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}
