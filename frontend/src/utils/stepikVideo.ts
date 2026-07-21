export interface StepikVideoUrl {
  quality?: string | number;
  url?: string;
}

export interface StepikVideoSource {
  id?: number;
  thumbnail?: string;
  urls?: StepikVideoUrl[];
  duration?: number;
  status?: string;
  upload_date?: string;
  filename?: string;
}

const PREFERRED_QUALITIES = ['720', '1080', '480', '360'];

function normalizeQuality(quality: string | number | undefined): string {
  if (quality === undefined || quality === null) return '';
  return String(quality);
}

/** Parses block.video whether it is a Stepik object or a legacy string. */
export function parseStepikVideoSource(video: unknown): StepikVideoSource | null {
  if (video == null) return null;
  if (typeof video === 'string') {
    const trimmed = video.trim();
    return trimmed ? { urls: [{ url: trimmed }] } : null;
  }
  if (typeof video !== 'object') return null;

  const source = video as StepikVideoSource;
  if (Array.isArray(source.urls) && source.urls.length > 0) {
    return source;
  }
  return null;
}

/** Picks the best playback URL from Stepik video.urls (720p preferred). */
export function getStepikVideoPlaybackUrl(
  video: unknown,
  preferredQuality = '720'
): string | null {
  const source = parseStepikVideoSource(video);
  if (!source?.urls?.length) return null;

  const urls = source.urls.filter((entry) => typeof entry.url === 'string' && entry.url.trim());
  if (!urls.length) return null;

  const byQuality = (quality: string) =>
    urls.find((entry) => normalizeQuality(entry.quality) === quality)?.url ?? null;

  const preferred = byQuality(preferredQuality);
  if (preferred) return preferred;

  for (const quality of PREFERRED_QUALITIES) {
    const match = byQuality(quality);
    if (match) return match;
  }

  return urls[0]?.url ?? null;
}

export function formatVideoDuration(seconds: number | undefined): string | null {
  if (seconds == null || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
