import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function isLowEnd() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('performance_mode') === 'true';
}
