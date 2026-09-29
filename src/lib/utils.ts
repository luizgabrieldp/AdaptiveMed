import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGreetingName(fullName?: string | null): string {
  if (!fullName) return 'Doutor(a)';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'Doutor(a)';
  if (['dr.', 'dra.', 'dr', 'dra'].includes(parts[0].toLowerCase())) {
    return parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
  }
  return parts[0];
}
