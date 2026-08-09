// Temporary instrumentation for investigating popup startup latency.
// Not for production use — remove once the investigation is done.

export async function timeIt<T>(
  label: string,
  promise: Promise<T>,
): Promise<T> {
  const t0 = performance.now();
  try {
    return await promise;
  } finally {
    console.log(`[perf] ${label}: ${(performance.now() - t0).toFixed(1)}ms`);
  }
}
