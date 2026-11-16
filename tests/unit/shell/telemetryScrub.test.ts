import { describe, expect, it } from 'vitest';
import { scrubItem, scrubUrl } from '@shell/platform/telemetryScrub';

describe('telemetry scrubbing', () => {
  it('keeps only the origin and path of a URL', () => {
    expect(scrubUrl('https://fimbulvetr.hellman.cloud/?screen=test_a&at=1,2#x')).toBe(
      'https://fimbulvetr.hellman.cloud/',
    );
    expect(scrubUrl('https://www.googleapis.com/drive/v3/files?q=name%3D%27s1%27')).toBe(
      'https://www.googleapis.com/drive/v3/files',
    );
    expect(scrubUrl('')).toBe('');
  });

  it('scrubs URLs inside any text, such as a breadcrumb message', () => {
    expect(scrubUrl('GET https://api.dropboxapi.com/2/files?code=abc 401')).toBe(
      'GET https://api.dropboxapi.com/2/files 401',
    );
  });

  it('scrubs the URL fields of an item and its breadcrumbs, and drops any user id', () => {
    const item = {
      type: 'error' as const,
      url: 'https://fimbulvetr.hellman.cloud/?code=secret',
      referrer: 'https://example.com/page?utm=x',
      user_id: 'someone',
      message: 'boom',
      breadcrumbs: [
        {
          category: 'http',
          message: 'GET https://example.com/a?token=t 200',
          data: { url: 'https://example.com/a?token=t', status_code: 200 },
        },
        { category: 'ui.click', message: 'button#play' },
      ],
    };
    expect(scrubItem(item)).toEqual({
      type: 'error',
      url: 'https://fimbulvetr.hellman.cloud/',
      referrer: 'https://example.com/page',
      message: 'boom',
      breadcrumbs: [
        {
          category: 'http',
          message: 'GET https://example.com/a 200',
          data: { url: 'https://example.com/a', status_code: 200 },
        },
        { category: 'ui.click', message: 'button#play' },
      ],
    });
  });
});
