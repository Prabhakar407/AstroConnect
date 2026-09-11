// Private requests use an HttpOnly session cookie, never a token in localStorage.
import { apiEndpoint } from './apiConfig';

export async function adminRequest(
  path,
  { payload, csrf, method = "GET" } = {},
) {
  const endpoint = apiEndpoint(`/api/admin${path}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, {
      method,
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: {
        ...(payload === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(csrf ? { "X-Astro-CSRF": csrf } : {}),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (
      !response.ok ||
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      const error = new Error(
        typeof data?.detail === "string"
          ? data.detail
          : "The calendar could not be updated. Please refresh before retrying.",
      );
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError)
      throw new Error(
        "The calendar did not respond. Refresh to check whether your change was saved before retrying.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

let googleScript;
export function loadGoogleSignIn() {
  if (window.google?.accounts?.id)
    return Promise.resolve(window.google.accounts.id);
  if (!googleScript)
    googleScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timeout = setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timeout);
        script.remove();
        googleScript = undefined;
        reject(new Error("Google sign-in did not load. Please try again."));
      }
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => {
        clearTimeout(timeout);
        if (window.google?.accounts?.id) resolve(window.google.accounts.id);
        else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    });
  return googleScript;
}
