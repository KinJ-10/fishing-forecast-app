import assert from "node:assert/strict";
import test from "node:test";
import { createSafeFetch, FetchLike } from "./fetchClient";

test("createSafeFetch binds unbound fetch-like functions to globalThis", async () => {
  let receivedThis: unknown;
  let receivedUrl = "";
  const fetchLike = function (this: unknown, input: RequestInfo | URL) {
    receivedThis = this;
    receivedUrl = String(input);
    return Promise.resolve({ ok: true, text: async () => "" } as Response);
  } as FetchLike;

  const safeFetch = createSafeFetch(fetchLike);
  await safeFetch("https://example.test/tide");

  assert.equal(receivedThis, globalThis);
  assert.equal(receivedUrl, "https://example.test/tide");
});

test("createSafeFetch throws when fetch is unavailable", async () => {
  const originalFetch = globalThis.fetch;

  Object.defineProperty(globalThis, "fetch", {
    value: undefined,
    configurable: true,
    writable: true,
  });

  try {
    const safeFetch = createSafeFetch(undefined);
    await assert.rejects(() => safeFetch("https://example.test/tide"), /fetch が利用できない環境/);
  } finally {
    Object.defineProperty(globalThis, "fetch", {
      value: originalFetch,
      configurable: true,
      writable: true,
    });
  }
});
