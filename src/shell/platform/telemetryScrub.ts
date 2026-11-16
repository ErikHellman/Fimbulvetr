/**
 * Keeps error reports and analytics anonymous: URLs lose their query string and fragment (a sign-in
 * callback's `?code=`, dev queries, API parameters), and no user id is ever sent.
 */

const URL_TAIL = /(https?:\/\/[^\s?#]*)[?#][^\s]*/g;

/** Text with every URL cut down to its origin and path. */
export function scrubUrl(text: string): string {
  return text.replace(URL_TAIL, '$1');
}

interface Crumb {
  message?: unknown;
  data?: unknown;
  [k: string]: unknown;
}

function scrubCrumb(c: Crumb): Crumb {
  const out: Crumb = { ...c };
  if (typeof c.message === 'string') out.message = scrubUrl(c.message);
  if (typeof c.data === 'object' && c.data !== null) {
    const data = { ...(c.data as Record<string, unknown>) };
    if (typeof data.url === 'string') data.url = scrubUrl(data.url);
    out.data = data;
  }
  return out;
}

/** A copy of a telemetry item with its URLs scrubbed and any user id removed. */
export function scrubItem<T extends Record<string, unknown>>(item: T): T {
  const out: Record<string, unknown> = { ...item };
  delete out.user_id;
  for (const key of ['url', 'referrer', 'name'] as const) {
    const v = out[key];
    if (typeof v === 'string') out[key] = scrubUrl(v);
  }
  if (Array.isArray(out.breadcrumbs)) out.breadcrumbs = (out.breadcrumbs as Crumb[]).map(scrubCrumb);
  return out as T;
}
