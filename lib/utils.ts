import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan nama kelas Tailwind dengan selamat (konvensyen shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
