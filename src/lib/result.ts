/** Small result type used where a failure needs a user-facing error key. */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function fail<T = never>(error: string): Result<T> {
  return { ok: false, error }
}