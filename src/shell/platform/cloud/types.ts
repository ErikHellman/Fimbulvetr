/** What cloud saves need from a storage service, and the pieces both services share. */

export interface CloudTokens {
  readonly access: string;
  /** Wall-clock ms when `access` stops working. */
  readonly expiresAt: number;
  /** Empty where the service gives a browser no refresh token (Google). */
  readonly refresh: string;
}

/** The player has to sign in again: the token ran out or was revoked, or the app was unlinked. */
export class CloudAuthError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = 'CloudAuthError';
  }
}

export interface HttpDeps {
  fetch(url: string, init: RequestInit): Promise<Response>;
  now(): number;
}

/** A flat folder of small text files that only this game can see. */
export interface CloudFiles {
  list(): Promise<string[]>;
  /** A file's text, or null when it does not exist. */
  read(name: string): Promise<string | null>;
  write(name: string, text: string): Promise<void>;
  /** Signs this browser out of the service. The files stay. */
  revoke(): Promise<void>;
}
