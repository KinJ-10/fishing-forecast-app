export type FetchLike = typeof fetch;

function createMissingFetchError(): Error {
  return new Error("fetch が利用できない環境です。");
}

export function createSafeFetch(fetchImpl?: FetchLike): FetchLike {
  const candidate = fetchImpl ?? globalThis.fetch;

  if (!candidate) {
    return (async () => {
      throw createMissingFetchError();
    }) as FetchLike;
  }

  return ((input: RequestInfo | URL, init?: RequestInit) =>
    Reflect.apply(candidate as typeof fetch, globalThis, [input, init])) as FetchLike;
}
