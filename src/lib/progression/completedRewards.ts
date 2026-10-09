// A result object belongs to one completed activity, including React Strict Mode remounts.
const processed = new WeakMap<object, unknown>()
export function oncePerCompletion<T>(result: object, apply: () => T): T {
  if (processed.has(result)) return processed.get(result) as T
  const summary = apply()
  processed.set(result, summary)
  return summary
}
