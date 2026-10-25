/** OAuth PKCE helpers (RFC 7636): a random verifier and its S256 challenge, both base64url. */

export function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 32 random bytes: a 43-character verifier, also used for the `state` parameter. */
export function randomToken(crypto: Crypto = globalThis.crypto): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function challengeOf(verifier: string, crypto: Crypto = globalThis.crypto): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}
