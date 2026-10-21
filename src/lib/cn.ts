import clsx, { type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Knows our custom scales so a later class (e.g. "w-40") wins over a default ("w-full").
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs', 'md'],
      shadow: ['popover', 'modal'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
