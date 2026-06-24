import { apiServices } from "./networkServices";

/**
 * Deduplicates concurrent GET requests to the same URL.
 *
 * On first login the dashboard layout shell and the metrics hook both request
 * `/projects` at roughly the same moment. Without dedup that is two identical
 * round trips. This helper keeps a short-lived map of in-flight GET promises
 * keyed by URL (+ serialized params): a second caller for a URL that is already
 * in flight awaits the same promise instead of issuing a new request.
 *
 * The entry is removed as soon as the request settles, so this only collapses
 * genuinely concurrent calls. It is not a cache and never serves stale data.
 */
const inflight = new Map<string, Promise<any>>();

function keyFor(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return url;
  return `${url}?${JSON.stringify(params)}`;
}

/**
 * Issues a GET request, sharing the in-flight promise with any concurrent
 * caller for the same URL+params. Returns the full Axios response so callers
 * can read `.data` exactly as they would from `apiServices.get`.
 */
export function getDeduped(
  url: string,
  config?: { params?: Record<string, any>; signal?: AbortSignal },
): Promise<any> {
  const key = keyFor(url, config?.params);

  const existing = inflight.get(key);
  if (existing) return existing;

  const request = apiServices.get(url, config).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, request);
  return request;
}
