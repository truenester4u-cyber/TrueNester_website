import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePropertyTypes(value?: string | null) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(/[|,]/)
    .map((type) => type.trim())
    .filter(Boolean);
}

export function getPrimaryPropertyType(value?: string | null) {
  const [first] = parsePropertyTypes(value);
  return first || "";
}
