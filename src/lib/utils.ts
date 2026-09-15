import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { KeyboardEvent } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Makes a non-button element (e.g. a clickable <Card> div or logo image)
 * behave like a button for keyboard and assistive-tech users: it becomes
 * focusable and activates on Enter/Space, and announces itself with
 * role="button". Pair with a visible `focus-visible:` ring in className.
 */
export function activatable(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onActivate()
      }
    },
  }
}