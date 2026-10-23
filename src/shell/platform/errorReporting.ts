import * as Sentry from '@sentry/browser';

/**
 * Crash reporting through Sentry. Off unless the build was given `VITE_SENTRY_DSN`, so `pnpm dev`, test
 * builds and forks send nothing. Only errors are reported: no tracing, no replays and no personal data.
 */
export function initErrorReporting(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    release: `fimbulvetr@${__APP_VERSION__}+${__BUILD_ID__}`,
    environment: import.meta.env.MODE,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  });
}
