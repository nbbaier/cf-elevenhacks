/**
 * Creates a throttled version of a function that only invokes the original
 * at most once per `wait` milliseconds. Trailing calls are always flushed
 * so the last value is never lost.
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number
): (...args: Args) => void {
  let lastArgs: Args | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    lastArgs = args;

    if (timer) {
      return;
    }

    fn(...args);
    lastArgs = null;

    timer = setTimeout(() => {
      timer = null;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, wait);
  };
}
